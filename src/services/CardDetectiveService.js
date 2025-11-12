export const createCardDetectiveService = ({
  httpService,
  gameId,
  playerId,
  otherPlayers,
  openSelectionModal
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

  const _promptForSets = (title, sets, ownerId) => {
    return new Promise(resolve => {
      openSelectionModal({
        title,
        items: sets,
        itemType: "set",
        ownerId,
        onSelect: selectedSetId => resolve(selectedSetId)
      });
    });
  };

  const callOtherSecrets = async (setId, targetPlayerId) => {
    let secrets = await httpService.getSecretsGame(gameId, targetPlayerId);
    secrets = secrets.filter(secret => !secret.revealed);

    let selectedSecretId;

    if (!secrets || secrets.length === 0) {
      return null;
    }

    selectedSecretId = await _promptForSecret(
      "Select a secret you want to reveal",
      secrets,
      targetPlayerId
    );
    return httpService.setsElectionSecret(gameId, {
      setId: setId,
      targetPlayerId: targetPlayerId,
      selectedSecretId: selectedSecretId
    });
  };

  const _effectChooseOtherPlayer = async (cards, selectedSetId) => {
    const selectedPlayerId = await _promptForPlayer("Select a player");

    if (!(selectedSetId === null)){
      return httpService.addDetectiveEffect(gameId, cards.id, playerId, {
        target_player: selectedPlayerId,
        set_id: selectedSetId
      });
    }
    else{
      const cardIds = cards.map(card => card.id);
      return httpService.playDetectiveEffect(gameId, cardIds, playerId, {
        target_player: selectedPlayerId
      });
    }
  };

  const _effectChooseOtherSecret = async (cards, isPyne, selectedSetId) => {
    const selectedPlayerId = await _promptForPlayer("Select a player");

    let secrets = await httpService.getSecretsGame(gameId, selectedPlayerId);

    if (isPyne) {
      secrets = secrets.filter(secret => secret.revealed);
    } else {
      secrets = secrets.filter(secret => !secret.revealed);
    }

    if (!secrets || secrets.length === 0) {
      return null;
    }

    const selectedSecretId = await _promptForSecret(
      `Choose one of their secrets to ${isPyne ? "hide" : "reveal"}`,
      secrets,
      selectedPlayerId
    );

    if (!(selectedSetId === null)){
      return httpService.addDetectiveEffect(gameId, cards.id, playerId, {
        target_player: selectedPlayerId,
        target_secret: selectedSecretId,
        set_id: selectedSetId
      });
    }
    else{
      const cardIds = cards.map(card => card.id);
      return httpService.playDetectiveEffect(gameId, cardIds, playerId, {
        target_player: selectedPlayerId,
        target_secret: selectedSecretId
      });
    }
  };

  const _activateSet = async (typeSet, cards, selectedSetId = null) => {
    switch (typeSet) {
      case "TB":
      case "LEB":
      case "TUB":
      case "MS":
      case "HARLEY_MS":
      case "SIBLINGS_B":
        return await _effectChooseOtherPlayer(cards, selectedSetId);

      case "HP":
      case "MM":
        return await _effectChooseOtherSecret(cards, false, selectedSetId);

      case "PP":
        return await _effectChooseOtherSecret(cards, true, selectedSetId);

      default:
        throw new Error(`The effect for the “${typeSet}” set is undefined`);
    }
  };

  const playSet = async cards => {
    const verificationResult = await httpService.verifySetDetective(cards);

    if (verificationResult) {
      return await _activateSet(verificationResult, cards);
    } else {
      throw new Error("The detective set is invalid");
    }
  };

  const addDetective = async (
    detective
  ) => {
    const detectiveType = detective.name.replace(/^D_/, "");
    if(detectiveType != "AO"){
      const sets = await httpService.getSets(gameId, playerId, null);
      if(sets.length === 0){
        return ("You don't have sets");
      }
      const selectedSetId = await _promptForSets(
        "Select the set you want to add the detective to",
        sets,
        playerId
      );
      const selectedSetInfo = await httpService.getSets(gameId, playerId, selectedSetId);
      let selectedSetType;
      switch(selectedSetInfo[0].type) {
        case "HARLEY_MS":
          selectedSetType = "MS"; break;
        case "SIBLINGS_B":
          selectedSetType = (detectiveType === "TB") ? "TB" : "TUB"; break;
        case "TB":
          selectedSetType = (detectiveType === "TUB") ? "TUB" : selectedSetInfo[0].type;
          break;
        case "TUB":
          selectedSetType = (detectiveType === "TB") ? "TB" : selectedSetInfo[0].type;
          break;
        default:
          selectedSetType = selectedSetInfo[0].type
          break;
      }
      if (selectedSetType != detectiveType) return;
      try {
        return await _activateSet(selectedSetType, detective, selectedSetId);
      } catch (error) {
        throw new Error("Could not add detective.", error);
      }
    }
    else{
      const targetPlayer = await _promptForPlayer("Select a player");
      const sets = await httpService.getSets(gameId, targetPlayer, null);
      if(sets.length === 0){
        return "Player has not sets";
      }
      const selectedSetId = await _promptForSets(
        `Select a set to add the detective to`,
        sets,
        targetPlayer
      );
      try {
        return await httpService.addAriadne(gameId, selectedSetId, playerId, detective.id);
      } catch (error) {
        throw new Error("Could not add detective.", error);
      }
    }
  };

  return {
    playSet,
    callOtherSecrets,
    addDetective
  };
};
