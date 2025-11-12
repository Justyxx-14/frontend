export const createCardActionsService = ({
  httpService,
  gameId,
  playerId,
  otherPlayers,
  openZoomModal,
  openSelectionModal,
  currentPlayer
}) => {
  // only ask the players for one thing and return a promise with the selection.
  const _promptForPlayer = title => {
    return new Promise(resolve => {
      openSelectionModal({
        title,
        items: otherPlayers,
        itemType: "player",
        onSelect: selectedPlayerId => resolve(selectedPlayerId)
      });
    });
  };
  const _promptForAllPlayers = title => {
    let allPlayer = [...otherPlayers, currentPlayer];

    return new Promise(resolve => {
      openSelectionModal({
        title,
        items: allPlayer,
        itemType: "player",
        onSelect: selectedPlayerId => resolve(selectedPlayerId)
      });
    });
  };

  const _promptForCard = (title, cards) => {
    return new Promise(resolve => {
      openSelectionModal({
        title,
        items: cards,
        itemType: "card",
        onSelect: selectedCardId => resolve(selectedCardId)
      });
    });
  };

  const _promptForSecret = (title, secrets, ownerId) => {
    return new Promise(resolve => {
      openSelectionModal({
        title,
        items: secrets,
        itemType: "secret",
        ownerId,
        onSelect: selectedSecretId => resolve(selectedSecretId)
      });
    });
  };

  const _promptForSets = (title, sets) => {
    return new Promise(resolve => {
      openSelectionModal({
        title,
        items: sets,
        itemType: "set",
        onSelect: selectedSecretId => resolve(selectedSecretId)
      });
    });
  };
  
  const _promptFordirection = (title, players) => {

    if (players[0].id === players[1].id) {
      // 2 player: player neighbors are the same person
      return Promise.resolve({ direction: "right" });
    }

    return new Promise(resolve => {
      openSelectionModal({
        title,
        items: players,
        itemType: "direction",
        onSelect: selectedDirection => resolve(selectedDirection)
      });
    });
  };

  const callPassCard = async direction => {
    try {
      const cards = await httpService.getCardsByPlayer(gameId, playerId);
      const cardId = await _promptForCard(
        `Select a card to pass to the ${direction}`,
        cards
      );
      return httpService.selectCardForPassing({
        gameId: gameId,
        playerId: playerId,
        cardId: cardId
      });
    } catch (error) {
      console.warn(error);
      return;
    }
  };

  const callVotePlayer = async () => {
    try {
      const selectedPlayerId = await _promptForPlayer(
        "Select a player to vote"
      );
      return httpService.votePlayer({
        gameId: gameId,
        playerId: playerId,
        targetPlayerId: selectedPlayerId
      });
    } catch (error) {
      console.warn(error);
      return;
    }
  };

  const callOtherSecrets = async (targetPlayerId, cardType) => {
    let secrets = await httpService.getSecretsGame(gameId, targetPlayerId);
    secrets = secrets.filter(secret => !secret.revealed);

    let selectedSecretId;

    if (!secrets || secrets.length === 0) {
      return null;
    }

    selectedSecretId = await _promptForSecret(
      "Select a secret you want to reveal",
      secrets,
      targetPlayerId,
    );
    return httpService.revealSecretAction({
      gameId,
      targetPlayerId,
      selectedSecretId,
      cardType
    });
  };

  const ECTselection = async playerName => {
    try {
      let playerCards = await httpService.getCardsByPlayer(gameId, playerId);
      const offeredCardId = await _promptForCard(
        `You must select a card to trade with ${playerName}`,
        playerCards
      );
      return offeredCardId;
    } catch (error) {
      console.warn(error);
      return;
    }
  };

  const deviousSent = async (data, playerWhoRecived) => {
    try {
      let secrets = await httpService.getSecretsGame(gameId, data.target_player_id);
      secrets = secrets.filter(secret => !secret.revealed);
      if (!secrets || secrets.length === 0) {
        return "Player has not secrets";
      }
      const secretRevealId = await _promptForSecret(
        `Select a ${playerWhoRecived}'s secret you want to see`,
        secrets,
        data.target_player_id
      );
      const secret = await httpService.viewSecret(secretRevealId);
      openZoomModal("secrets", [secret], `${playerWhoRecived}'s secret`,true);
    } catch (error) {
      console.warn(error);
      return;
    }
  };

  const playCardEvent = async card => {
    switch (card.name) {
      case "E_COT":
        return await _playECOT(card);
      case "E_AV":
        return await _playEAV(card);
      case "E_LIA":
        return await _playELIA(card);
      case "E_ATWOM":
        return await _playEATWOM(card);
      case "E_DME":
      case "E_ETP":
      case "E_PYS":
        return await _playNormal(card);
      case "E_DCF":
        return await _playEDCF(card);
      case "E_CT":
        return await _playECT(card);
      case "E_NSF":
        return await _playENSF(card);
      default:
        console.warn(`The card "${card.description}" don't have an action`);
        return null;
    }
  };

  const _playECOT = async card => {
    const selectedPlayerId = await _promptForPlayer(
      `Select a player to play ${card.description}`
    );

    try {
      return httpService.playCardEvent({
        gameId: gameId,
        eventId: card.id,
        playerId: playerId,
        eventCode: card.name,
        targetPlayer: selectedPlayerId
      });
    } catch (error) {
      return error;
    }
  };

  const _playELIA = async card => {
    try {
      let discardCards = await httpService.getLastDiscardedCards(gameId, 5);
      if (discardCards.length === 0) return null;

      let selectedCardId = await _promptForCard(
        "Select one card to take",
        discardCards
      );

      return httpService.playCardEvent({
        gameId: gameId,
        eventId: card.id,
        playerId: playerId,
        eventCode: card.name,
        cardId: selectedCardId
      });
    } catch (error) {
      return error;
    }
  };

  const _playEATWOM = async card => {
    const selectedPlayerId = await _promptForPlayer(
      "Select a player to take a secret from him"
    );
    let secrets;
    try {
      secrets = await httpService.getSecretsGame(gameId, selectedPlayerId);
      secrets = secrets.filter(secret => secret.revealed);
      if (secrets.length === 0) return null;
    } catch (error) {
      console.warn(error);
    }

    const selectedSecretId = await _promptForSecret(
      "Choose one revealed secret",
      secrets,
      selectedPlayerId
    );
    const targetPlayerId = await _promptForAllPlayers(
      "Select a player to give the secret"
    );
    try {
      return httpService.playCardEvent({
        gameId: gameId,
        eventId: card.id,
        playerId: playerId,
        eventCode: card.name,
        targetPlayer: targetPlayerId,
        secretId: selectedSecretId
      });
    } catch (error) {
      console.warn(error);
    }
  };

  const _playEAV = async card => {
    try {
      const setsResponses = await Promise.all(
        otherPlayers.map(otherPlayer =>
          httpService.getSets(gameId, otherPlayer.id)
        )
      );
      const sets = setsResponses.flat();
      if (sets.length === 0) return null;

      let seletedSetId = await _promptForSets("Select one set", sets);
      const targetPlayerId = await _promptForPlayer(
        "select a player to play the set"
      );

      const selectedSet = sets.find(s => s.id === seletedSetId);
      let secrets = null;
      let selectedSecretId = null;

      if (["HP", "MM", "PP"].includes(selectedSet.type)) {
        secrets = await httpService.getSecretsGame(gameId, targetPlayerId);
        secrets = secrets.filter(secret => !secret.revealed);
        if (secrets.length === 0) return null;

        selectedSecretId = await _promptForSecret(
          "Select a secret you want to reveal",
          secrets,
          targetPlayerId
        );
      }

      return httpService.playCardEvent({
        gameId: gameId,
        eventId: card.id,
        playerId: playerId,
        eventCode: card.name,
        targetPlayer: targetPlayerId,
        secretId: selectedSecretId,
        setId: seletedSetId
      });
    } catch (error) {
      console.warn(error);
    }
  };

  const _playEDCF = async card => {
    try {
      let playerNeighbors = await httpService.getPlayerNeighbors(
        gameId,
        playerId
      );

      let selectedInfo = await _promptFordirection(
        "Select direction to pass a card",
        [playerNeighbors.previous_player, playerNeighbors.next_player]
      );

      try {
        return httpService.playCardEvent({
          gameId: gameId,
          eventId: card.id,
          playerId: playerId,
          eventCode: card.name,
          direction: selectedInfo.direction
        });
      } catch (error) {
        console.warn(error);
        return;
      }
    } catch (error) {
      console.warn(error);
      return;
    }
  };

  const _playECT = async card => {
    try {
      let playerCards = await httpService.getCardsByPlayer(gameId, playerId);
      playerCards = playerCards.filter(
        card => !(card.description === "Card Trade")
      );
      const targetPlayerId = await _promptForPlayer("Select a player to trade");

      const offeredCardId = await _promptForCard(
        "Select the card you want to trade",
        playerCards
      );
      try {
        let result = await httpService.playCardEvent({
          gameId: gameId,
          eventId: card.id,
          playerId: playerId,
          eventCode: card.name,
          targetPlayer: targetPlayerId,
          offeredCardId: offeredCardId
        });
        return result;
      } catch (error) {
        console.warn(error);
        return;
      }
    } catch (error) {
      console.warn(error);
      return;
    }
  };

  const _playENSF = async card => {
    try {
      return httpService.playCardNSF({
        gameId: gameId,
        eventId: card.id,
        playerId: playerId
      });
    } catch (error) {
      console.warn(error);
    }
  };

  const _playNormal = async card => {
    try {
      return httpService.playCardEvent({
        gameId: gameId,
        eventId: card.id,
        playerId: playerId,
        eventCode: card.name
      });
    } catch (error) {
      console.warn(error);
    }
  };

  return {
    playCardEvent,
    callPassCard,
    callVotePlayer,
    callOtherSecrets,
    ECTselection,
    deviousSent
  };
};
