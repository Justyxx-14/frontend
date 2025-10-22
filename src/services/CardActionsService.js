export const createCardActionsService = ({
  httpService,
  gameId,
  playerId,
  otherPlayers,
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
        return await _playNormal(card);
      // case "E_PYS":
      // case "E_DCF":
      // case "E_CT":
      // case "E_NSF":
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
      return httpService.playCardEvent(
        gameId,
        card.id,
        playerId,
        selectedPlayerId,
        null,
        null,
        null,
        card.name
      );
    } catch (error) {
      return error;
    }
  };

  const _playELIA = async card => {
    try {
      let discardCards = await httpService.getLastDiscardedCards(gameId, 5);

      if (discardCards.length === 0) {
        return null;
      }

      let selectedCardId = await _promptForCard(
        "Select one card to take",
        discardCards
      );

      return httpService.playCardEvent(
        gameId,
        card.id,
        playerId,
        null,
        selectedCardId,
        null,
        null,
        card.name
      );
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

      if (secrets.length === 0) {
        return null;
      }
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
      return httpService.playCardEvent(
        gameId,
        card.id,
        playerId,
        targetPlayerId,
        null,
        selectedSecretId,
        null,
        card.name
      );
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

      if (sets.length === 0) {
        return null;
      }

      let seletedSetId = await _promptForSets("select one set", sets);

      return httpService.playCardEvent(
        gameId,
        card.id,
        playerId,
        null,
        null,
        null,
        seletedSetId,
        card.name
      );
    } catch (error) {
      console.warn(error);
    }
  };

  const _playNormal = async card => {
    try {
      return httpService.playCardEvent(
        gameId,
        card.id,
        playerId,
        null,
        null,
        null,
        null,
        card.name
      );
    } catch (error) {
      console.warn(error);
    }
  };

  return {
    playCardEvent
  };
};
