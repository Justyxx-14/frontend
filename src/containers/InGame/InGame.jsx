import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useGame } from "@/context/useGame";
import { createWSService } from "@/services/WSService";
import { createHttpService } from "@/services/HttpService";
import { createCardActionsService } from "@/services/CardActionsService";
import { createCardDetectiveService } from "@/services/CardDetectiveService";

import toast from "react-hot-toast";
import InGameLayout from "./components/InGameLayout";
import SelectionModal from "./components/SelectionModal";

const InGame = () => {
  const { gameId } = useParams();
  const {
    currentGame,
    idPlayer,
    discardCardsContext,
    cardsByPlayerContext,
    dataPlayers
  } = useGame();

  const [wsService] = useState(() => createWSService());
  const [httpService] = useState(() => createHttpService());
  const [inventoryCards, setInventoryCards] = useState([]);
  const [inventoryDraftCards, setInventoryDraftCards] = useState([]);
  const [inventorySecrets, setInventorySecrets] = useState([]);
  const [lastCardDiscarded, setLastCardDiscarded] = useState(null);
  const [selectedCardIds, setSelectedCardIds] = useState(new Set());
  const [currentTurnID, setCurrentTurnID] = useState(null);
  const [isCurrentTurn, setIsCurrentTurn] = useState(null);
  const [players, setPlayers] = useState();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hideTurnWarning, setHideTurnWarning] = useState(
    localStorage.getItem("hideTurnWarning") === "true"
  );

  const [turnPhase, setTurnPhase] = useState(() => {
    const storageKey = `game-${gameId}-turnPhase`;
    const savedPhase = localStorage.getItem(storageKey);
    return savedPhase || "noAction";
  }); // action || noAction || draw || discard

  const [zoomModalState, setZoomModalState] = useState({ isOpen: false });
  const [selectionModalState, setSelectionModalState] = useState({
    isOpen: false
  });

  //
  const cardActionsService = useMemo(() => {
    if (!httpService || !gameId || !idPlayer || !dataPlayers) return null;

    const otherPlayersList = Object.entries(dataPlayers)
      .filter(([id]) => id !== idPlayer)
      .map(([id, name]) => ({ id, name }));

    return createCardActionsService({
      httpService,
      gameId,
      playerId: idPlayer,
      otherPlayers: otherPlayersList,
      openSelectionModal: config => {
        setSelectionModalState({
          isOpen: true,
          ...config,
          onSelect: selectedId => {
            config.onSelect(selectedId);
            setSelectionModalState({ isOpen: false });
          }
        });
      }
    });
  }, [httpService, gameId, idPlayer, dataPlayers]);

  const cardDetectiveService = useMemo(() => {
    if (!httpService || !gameId || !idPlayer || !dataPlayers) return null;

    const otherPlayersList = Object.entries(dataPlayers)
      .filter(([id]) => id !== idPlayer)
      .map(([id, name]) => ({ id, name }));

    return createCardDetectiveService({
      httpService,
      gameId,
      playerId: idPlayer,
      otherPlayers: otherPlayersList,
      openSelectionModal: config => {
        setSelectionModalState({
          isOpen: true,
          ...config,
          onSelect: selectedId => {
            config.onSelect(selectedId);
            setSelectionModalState({ isOpen: false });
          }
        });
      }
    });
  }, [httpService, gameId, idPlayer, dataPlayers]);

  useEffect(() => {
    const storageKey = `game-${gameId}-turnPhase`;

    localStorage.removeItem(storageKey);

    localStorage.setItem(storageKey, turnPhase);

    return () => {
      localStorage.removeItem(storageKey);
    };
  }, [gameId, turnPhase]);

  // Format players data
  useEffect(() => {
    if (dataPlayers) {
      const formatted = Object.entries(dataPlayers).reduce(
        (acc, [id, name]) => {
          acc[id] = { name, cards: 6 };
          return acc;
        },
        {}
      );
      setPlayers(formatted);
    }
  }, [dataPlayers]);

  // Get initial hand
  useEffect(() => {
    const init = async () => {
      if (!currentGame || !idPlayer) return;
      try {
        const cards = await cardsByPlayerContext(currentGame.id, idPlayer);
        setInventoryCards(cards || []);
      } catch (error) {
        console.error("Error fetching initial hand:", error);
      }
      try {
        const draftCards = await httpService.getDraftCards(currentGame.id);
        setInventoryDraftCards(draftCards || []);
      } catch (error) {
        console.error("Error fetching draft cards:", error);
      }
      try {
        // in this moment cards/top_discard/{game_id} give five cards
        let lastCard = await httpService.getLastDiscardedCard(currentGame.id);
        setLastCardDiscarded(lastCard ? lastCard[0] : {});
      } catch (error) {
        if (error.response?.status === 404) {
          setLastCardDiscarded(null);
        } else {
          console.error("Error drawing from regular deck:", error);
        }
      }
      try {
        const secrets = await httpService.getSecretsGame(
          currentGame.id,
          idPlayer
        );
        setInventorySecrets(secrets);
      } catch (error) {
        console.error("Error fetching secrets:", error);
      }
    };
    init();
  }, [currentGame, idPlayer, cardsByPlayerContext, gameId]);

  // Init turns and WebSocket listeners
  useEffect(() => {
    const init = async () => {
      try {
        if (!idPlayer || !currentGame?.id) return;

        const firstTurnPlayerId = await httpService.getTurnGame(currentGame.id);
        setCurrentTurnID(firstTurnPlayerId.id);
        setIsCurrentTurn(firstTurnPlayerId.id === idPlayer);

        setTimeout(() => {
          wsService.connect(currentGame.id);
        }, 500);

        wsService.on("turnChange", data => {
          setCurrentTurnID(data);
          setIsCurrentTurn(data === idPlayer);
          setTurnPhase("action");
        });

        wsService.on("updateDraft", data => {
          setInventoryDraftCards(data.draft || []);
          const playerName = dataPlayers[data.player_id];
          if (!isCurrentTurn && data.player_id !== idPlayer) {
            toast.success(`${playerName} drew 1 card from the draft`);
          }
        });

        wsService.on("playerDrawCards", data => {
          const playerName = dataPlayers[data.id_player];
          if (!isCurrentTurn && data.id_player !== idPlayer) {
            toast.success(
              `${playerName} drew ${data.n_cards} card${
                data.n_cards > 1 ? "s" : ""
              } from the regular deck`
            );
          }
        });

        wsService.on("playerCardDiscarded", data => {
          setLastCardDiscarded(data.last_card);
        });

        wsService.on("disconnect", () => {
          console.warn("WebSocket disconnected");
        });

        wsService.on("targetPlayerElection", async data => {
          if (data.target_player == idPlayer) {
            cardActionsService.callOtherSecrets;
            try {
              const result = await cardDetectiveService.callOtherSecrets(
                data.set_id,
                data.target_player
              );

              if (result) {
                toast.success(`Your secrets was revelead`);
              } else {
                toast.info("The player you selected has no secrets available");
              }
            } catch (error) {
              toast.error(error.message || "error");
            }
          }
        });
      } catch (error) {
        console.error("Failed to initialize:", error);
      }
    };

    init();
    return () => wsService.disconnect();
  }, [idPlayer, currentGame, httpService, wsService]);

  // Handlers
  const handleCardClick = id => {
    setSelectedCardIds(prevSet => {
      const newSet = new Set(prevSet);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const handleNextTurn = async () => {
    if (!isCurrentTurn) return;

    try {
      let cardsInHand = [...inventoryCards];

      if (turnPhase === "action" && cardsInHand.length > 0) {
        const randomIndex = Math.floor(Math.random() * cardsInHand.length);
        const randomCard = cardsInHand[randomIndex];

        await discardCardsContext(currentGame.id, idPlayer, [randomCard.id]);

        cardsInHand.splice(randomIndex, 1);
      }

      // Calculate how many cards are needed to get back to 6
      const cardsToDraw = 6 - cardsInHand.length;

      let finalCards = cardsInHand;

      if (cardsToDraw > 0) {
        const newCards = await httpService.regularDrawCards(
          currentGame.id,
          idPlayer,
          cardsToDraw
        );
        finalCards = [...cardsInHand, ...newCards];
      }

      setInventoryCards(finalCards);

      await httpService.nextTurnGame(currentGame.id);

      // Reset turn state for the next player
      setSelectedCardIds(new Set());
      setTurnPhase("action");
    } catch (error) {
      console.error("Error advancing to next turn:", error);
      toast.error("There was an error while attempting to pass the turn");
    }
  };

  const handleNextTurnRequest = async () => {
    if (inventoryCards.length < 6) {
      toast.error("You must have 6 cards in your hand to end the turn");
      return;
    }

    if (turnPhase === "action" && !hideTurnWarning) {
      setShowConfirmModal(true);
      return;
    }
    await handleNextTurn();
  };

  const confirmNextTurn = async () => {
    setShowConfirmModal(false);
    await handleNextTurn();
  };

  const handleHideWarningChange = checked => {
    setHideTurnWarning(checked);
    localStorage.setItem("hideTurnWarning", checked);
  };

  const handleDrawRegularCard = async count => {
    if (inventoryCards.length >= 6) {
      toast.error("You can't draw any more cards, limit reached");
      return;
    }

    try {
      const newCards = await httpService.regularDrawCards(
        currentGame.id,
        idPlayer,
        count
      );
      setInventoryCards(prev => [...prev, ...newCards]);
      toast.success(`You drew ${count} card${count > 1 ? "s" : ""}`);

      setTurnPhase("draw");
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error("You can't draw any more cards, limit reached");
      } else {
        console.error("Error drawing from regular deck:", error);
        toast.error("Error while attempting to draw a card. Please try again");
      }
    }
  };

  const handleDiscardAction = async () => {
    if (turnPhase === "draw") {
      toast.error("You can't discard after drawing");
      return;
    }

    const cardsToDiscard = Array.from(selectedCardIds);
    if (cardsToDiscard.length === 0) return;

    try {
      await discardCardsContext(currentGame.id, idPlayer, cardsToDiscard);

      setInventoryCards(prev =>
        prev.filter(card => !cardsToDiscard.includes(card.id))
      );
      setSelectedCardIds(new Set());
      toast.success("Cards discarded.");
      setTurnPhase("discard");
    } catch (error) {
      console.error("Error trying to discard:", error);
      toast.error("Couldn't discard the cards");
    }
  };

  const handleDrawDraftCard = async cardId => {
    try {
      const newCard = await httpService.drawDraftCard(
        currentGame.id,
        cardId,
        idPlayer
      );
      setInventoryCards(prev => [...prev, newCard]);
      setInventoryDraftCards(prev => prev.filter(card => card.id !== cardId));
      setTurnPhase("draw");
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error("You can't draw any more cards, limit reached.");
      } else {
        toast.error("Error while attempting to draw a card. Please try again");
      }
    }
  };

  const openZoomModal = (type, cardsToShow, isOwnSecrets = false) => {
    setZoomModalState({
      isOpen: true,
      modalType: type,
      cards: cardsToShow,
      viewingOwnSecrets: isOwnSecrets
    });
  };

  const closeZoomModal = () => setZoomModalState({ isOpen: false });

  const handleShowSecrets = async (targetPlayerId = null) => {
    if (!targetPlayerId || targetPlayerId === idPlayer) {
      openZoomModal("secrets", inventorySecrets, true);
    } else {
      try {
        const secrets = await httpService.getSecretsGame(
          currentGame.id,
          targetPlayerId
        );
        if (secrets?.length > 0) {
          openZoomModal("secrets", secrets, false);
        } else {
          toast.error("This player has no secrets.");
        }
      } catch (error) {
        toast.error("Could not fetch secrets.");
      }
    }
  };

  const handleShowSets = async (targetPlayerId = idPlayer, targetSetId = null) => {
    try {
      const sets = await httpService.getSets(
        currentGame.id,
        targetPlayerId,
        targetSetId
      );
      if (sets?.length > 0) {
        openZoomModal("sets", sets);
      } else {
        toast.error("This player has no sets.");
      }
    } catch (error) {
      toast.error("Could not fetch sets.");
    }
  };

  const handlePlayCard = async () => {
    if (turnPhase == "noAction") {
      return toast.error("You can't do more than one action");
    }
    if (turnPhase == "draw" || turnPhase == "discard") {
      return toast.error(
        "You can't take an action after drawing or discarding"
      );
    }
    if (!cardActionsService) return toast.error("The game isn't ready");

    const cardsSelected = Array.from(selectedCardIds);

    const selectedCards = inventoryCards.filter(card =>
      cardsSelected.includes(card.id)
    );

    // one card
    if (selectedCards.length === 1) {
      const card = selectedCards[0];
      if (card.type === "EVENT") {
        try {
          const result = await cardActionsService.playCardEvent(card);
          if (result) {
            toast.success(`${card.description} card was played`);
            setInventoryCards(prev => prev.filter(c => c.id !== card.id));
            setSelectedCardIds(new Set());

            setTurnPhase("noAction");
          }
        } catch (error) {
          toast.error("The card could not be played");
          console.error(error.message);
        }
        return;
      }
    }

    const allDetectives = selectedCards.every(
      card => card.type === "DETECTIVE"
    );

    if (!allDetectives) {
      return toast.error(
        "If you play more than one card, they must all be Detective cards"
      );
    }

    try {
      const result = await cardDetectiveService.playSet(selectedCards);

      if (result) {
        toast.success(`the set was played`);
        setInventoryCards(prev =>
          prev.filter(c => !cardsSelected.includes(c.id))
        );
        setSelectedCardIds(new Set());
        setTurnPhase("noAction");
      } else {
        toast.error("The player you selected has no secrets available");
      }
    } catch (error) {
      toast.error(error.message || "The cards could not be played");
    }
  };

  // Split current player and other players
  const currentPlayer = players ? players[idPlayer] : null;
  const otherPlayers = players
    ? Object.entries(players).filter(([id]) => id !== idPlayer)
    : [];

  const isDiscardButtonEnabled = selectedCardIds.size > 0;

  return (
    <>
      <InGameLayout
        handleNextTurnRequest={handleNextTurnRequest}
        onConfirmNextTurn={confirmNextTurn}
        onCancelNextTurn={() => setShowConfirmModal(false)}
        hideTurnWarning={hideTurnWarning}
        showConfirmModal={showConfirmModal}
        onHideWarningChange={handleHideWarningChange}
        playerId={idPlayer}
        turnPhase={turnPhase}
        currentTurnID={currentTurnID}
        isCurrentTurn={isCurrentTurn}
        selectedCardIds={selectedCardIds}
        currentPlayer={currentPlayer}
        otherPlayers={otherPlayers}
        handleDiscard={handleDiscardAction}
        isDiscardButtonEnabled={isDiscardButtonEnabled}
        handleCardClick={handleCardClick}
        handleDrawRegularCard={handleDrawRegularCard}
        handleDrawDraftCard={handleDrawDraftCard}
        lastCardDiscarded={lastCardDiscarded}
        inventoryDraftCards={inventoryDraftCards}
        inventoryCards={inventoryCards}
        inventorySecrets={inventorySecrets}
        handlePlayCard={handlePlayCard}
        isModalOpen={zoomModalState.isOpen}
        closeModal={closeZoomModal}
        modalCards={zoomModalState.cards}
        modalType={zoomModalState.modalType}
        viewingOwnSecrets={zoomModalState.viewingOwnSecrets}
        onShowSecrets={handleShowSecrets}
        onShowSets={handleShowSets}
        openModal={openZoomModal}
      />
      <SelectionModal
        isOpen={selectionModalState.isOpen}
        title={selectionModalState.title}
        items={selectionModalState.items}
        itemType={selectionModalState.itemType}
        onSelect={selectionModalState.onSelect}
        viewingPlayerId={idPlayer}
      />
    </>
  );
};

export default InGame;
