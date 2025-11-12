import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGame } from "@/context/useGame";
import { createWSService } from "@/services/WSService";
import { createHttpService } from "@/services/HttpService";
import { createCardActionsService } from "@/services/CardActionsService";
import { createCardDetectiveService } from "@/services/CardDetectiveService";

import toast from "react-hot-toast";
import InGameLayout from "./components/InGameLayout";
import SelectionModal from "./components/SelectionModal";
import { UseTurnPhase } from "@/services/UseTurnPhase";
import TurnTimer from "./components/TurnTimer";
import { UseGameWebSocket } from "@/services/UseGameWebSocket";
import { UseCardPlay } from "@/services/UseCardPlay";
import HowToPlayModal from "../components/HowToPlay";

const InGame = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();

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
  const [isPlayerSocialDisgrace, setIsPlayerSocialDisgrace] = useState(null);
  const [players, setPlayers] = useState();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [canNoSoFast, setCanNoSoFast] = useState(false);
  const [nsfResetKey, setNsfResetKey] = useState(0);

  const [hideTurnWarning, setHideTurnWarning] = useState(
    localStorage.getItem("hideTurnWarning") === "true"
  );

  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const { turnInfo, setTurnInfo, initialRemainingTime, timerIsPaused } =
    UseTurnPhase({
      currentGame,
      httpService,
      idPlayer,
      inventoryCards,
      inventoryDraftCards,
      inventorySecrets,
      setCurrentTurnID,
      setIsCurrentTurn,
      currentTurnID
    });

  const turnState = turnInfo?.turn_state || null;

  const [zoomModalState, setZoomModalState] = useState({ isOpen: false });
  const [selectionModalState, setSelectionModalState] = useState({
    isOpen: false
  });

  const openZoomModal = (type, cardsToShow, title, isOwnSecrets = false) => {
    setZoomModalState({
      isOpen: true,
      modalType: type,
      cards: cardsToShow,
      title: title,
      viewingOwnSecrets: isOwnSecrets
    });
  };

  const closeZoomModal = () => setZoomModalState({ isOpen: false });

  const cardActionsService = useMemo(() => {
    if (!httpService || !gameId || !idPlayer || !dataPlayers) return null;

    const otherPlayersList = Object.entries(dataPlayers)
      .filter(([id]) => id !== idPlayer)
      .map(([id, name]) => ({ id, name }));

    let currentPlayer = Object.entries(dataPlayers)
      .filter(([id]) => id === idPlayer)
      .map(([id, name]) => ({ id, name }))[0];

    return createCardActionsService({
      httpService,
      gameId,
      playerId: idPlayer,
      otherPlayers: otherPlayersList,
      currentPlayer,
      openZoomModal,
      openSelectionModal: config => {
        setSelectionModalState(prev => ({
          isOpen: true,
          ...config,
          onSelect: selectedId => {
            config.onSelect(selectedId);
            setSelectionModalState({ isOpen: false });
          }
        }));
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
        setSelectionModalState(prev => ({
          isOpen: true,
          ...config,
          onSelect: selectedId => {
            config.onSelect(selectedId);
            setSelectionModalState({ isOpen: false });
          }
        }));
      }
    });
  }, [httpService, gameId, idPlayer, dataPlayers]);

  const reloadPlayerData = async () => {
    if (!currentGame?.id || !idPlayer) return;
    try {
      const [cards, draft, secrets] = await Promise.all([
        cardsByPlayerContext(currentGame.id, idPlayer),
        httpService.getDraftCards(currentGame.id),
        httpService.getSecretsGame(currentGame.id, idPlayer)
      ]);

      setInventoryCards(cards || []);
      setInventoryDraftCards(draft || []);
      setInventorySecrets(secrets || []);
      const socialStatus = await httpService.getSocialDisgraceByGame(
        currentGame.id
      );
      setIsPlayerSocialDisgrace(socialStatus);
      try {
        const lastCard = await httpService.getLastDiscardedCards(
          currentGame.id,
          1
        );
        setLastCardDiscarded(lastCard ? lastCard[0] : {});
      } catch (err) {
        if (err.response?.status === 404) setLastCardDiscarded(null);
        else console.error("Error fetching last discarded", err);
      }
    } catch (err) {
      console.error("Error reloading player data", err);
    }
  };

  useEffect(() => {
    if (!currentGame || !idPlayer) return;
    reloadPlayerData();
  }, [currentGame, idPlayer, cardsByPlayerContext]);

  useEffect(() => {
    if (dataPlayers) {
      const formatted = Object.entries(dataPlayers).reduce(
        (acc, [id, name]) => {
          acc[id] = { name, cards: 6, socialDisgrace: false };
          return acc;
        },
        {}
      );
      setPlayers(formatted);
    }
  }, [dataPlayers]);
  // Apply Social Disgrace info into players
  useEffect(() => {
    if (!players || !isPlayerSocialDisgrace) return;

    setPlayers(prev => {
      const updated = structuredClone(prev);
      Object.entries(isPlayerSocialDisgrace).forEach(([playerId, status]) => {
        if (updated[playerId]) {
          updated[playerId].socialDisgrace = status;
        }
      });
      return updated;
    });
  }, [isPlayerSocialDisgrace]);
  UseGameWebSocket({
    wsService,
    httpService,
    currentGame,
    idPlayer,
    dataPlayers,
    setCurrentTurnID,
    setIsCurrentTurn,
    setTurnState: setTurnInfo,
    reloadPlayerData,
    navigate,
    gameId,
    cardDetectiveService,
    cardActionsService,
    setIsPlayerSocialDisgrace,
    setCanNoSoFast,
    setNsfResetKey
  });

  const { handlePlayCard } = UseCardPlay({
    cardActionsService,
    cardDetectiveService,
    inventoryCards,
    selectedCardIds,
    setInventoryCards,
    setSelectedCardIds,
    setTurnState: setTurnInfo,
    turnState
  });

  useEffect(() => {
    const runEffect = async () => {
      if (!turnInfo || selectionModalState.isOpen) return;

      const state = turnInfo.turn_state;
      const targetPlayerId = turnInfo.target_player_id;
      const playersWhoActed = turnInfo.players_who_selected_card || [];
      const playersWhoVoted = turnInfo.players_who_voted || [];

      const iHaveActed = playersWhoActed.includes(idPlayer);
      const iHaveVoted = playersWhoVoted.includes(idPlayer);

      try {
        switch (state) {
          case "CHOOSING_SECRET":
            if (targetPlayerId === idPlayer && !iHaveActed) {
              await cardDetectiveService.callOtherSecrets(
                turnInfo.set_id,
                targetPlayerId,
                turnInfo.set_type
              );
            }
            break;

          case "PASSING_CARDS":
            if (!iHaveActed) {
              await cardActionsService.callPassCard(turnInfo.passing_direction);
            }
            break;

          case "CHOOSING_SECRET_PYS":
            if (targetPlayerId === idPlayer) {
              const res = await cardActionsService.callOtherSecrets(
                targetPlayerId
              );
              if (res) {
                reloadPlayerData();
                const namePlayer = dataPlayers?.[targetPlayerId];
                toast.success(`${namePlayer}'s secret was revealed`);
              }
            }
            break;

          case "VOTING":
            if (!iHaveVoted) {
              const res = await cardActionsService.callVotePlayer();
              if (res) {
                toast.success(`Vote taken`);
              }
            } else {
              toast.dismissAll();

              toast.loading(`Waiting for other players to vote...`, {
                duration: Infinity
              });
            }
            break;
          case "CANCELED_CARD_PENDING":
            setCanNoSoFast(true);
            break;
          default:
            break;
        }
      } catch (error) {
        toast.error(error?.message || "Error when processing action");
      }
    };

    runEffect();
  }, [turnInfo]);

  const handleNextTurn = async () => {
    if (!isCurrentTurn) return;

    try {
      let cardsInHand = [...inventoryCards];

      if (turnState === "IDLE" && cardsInHand.length > 0) {
        const randomIndex = Math.floor(Math.random() * cardsInHand.length);
        const randomCard = cardsInHand[randomIndex];

        await discardCardsContext(currentGame.id, idPlayer, [randomCard.id]);
        cardsInHand.splice(randomIndex, 1);
      }

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

      setSelectedCardIds(new Set());
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

    if (turnState === "IDLE" && !hideTurnWarning) {
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
    if (turnState === "DRAWING_CARDS") {
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
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error("You can't draw any more cards, limit reached.");
      } else {
        toast.error("Error while attempting to draw a card. Please try again");
      }
    }
  };

  const handleShowSecrets = async (targetPlayerId = null) => {
    if (!targetPlayerId || targetPlayerId === idPlayer) {
      openZoomModal("secrets", inventorySecrets, "", true);
    } else {
      try {
        const secrets = await httpService.getSecretsGame(
          currentGame.id,
          targetPlayerId
        );
        if (secrets?.length > 0) openZoomModal("secrets", secrets, false);
        else toast.error("This player has no secrets.");
      } catch (error) {
        toast.error("Could not fetch secrets.");
      }
    }
  };

  const handleShowSets = async (
    targetPlayerId = idPlayer,
    targetSetId = null
  ) => {
    try {
      const sets = await httpService.getSets(
        currentGame.id,
        targetPlayerId,
        targetSetId
      );
      if (sets?.length > 0) openZoomModal("sets", sets);
      else toast.error("This player has no sets.");
    } catch (error) {
      toast.error("Could not fetch sets.");
    }
  };

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
        turnState={turnState}
        currentTurnID={currentTurnID}
        isCurrentTurn={isCurrentTurn && turnState !== "CHOOSING_SECRET"}
        selectedCardIds={selectedCardIds}
        currentPlayer={currentPlayer}
        otherPlayers={otherPlayers}
        handleDiscard={handleDiscardAction}
        isDiscardButtonEnabled={isDiscardButtonEnabled}
        handleCardClick={id =>
          setSelectedCardIds(prev => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
          })
        }
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
        modalTitle={zoomModalState.title}
        viewingOwnSecrets={zoomModalState.viewingOwnSecrets}
        onShowSecrets={handleShowSecrets}
        onShowSets={handleShowSets}
        openModal={openZoomModal}
        onShowHelp={() => setIsHelpModalOpen(true)}
        canNoSoFast={canNoSoFast}
        nsfResetKey={nsfResetKey}
      />

      <TurnTimer
        remainingTime={initialRemainingTime ?? 0}
        key={turnInfo?.current_turn}
        isMyTurn={isCurrentTurn}
        timerIsPaused={timerIsPaused}
      />

      <SelectionModal
        isOpen={selectionModalState.isOpen}
        title={selectionModalState.title}
        items={selectionModalState.items}
        itemType={selectionModalState.itemType}
        onSelect={selectionModalState.onSelect}
        viewingPlayerId={idPlayer}
      />

      <HowToPlayModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </>
  );
};

export default InGame;
