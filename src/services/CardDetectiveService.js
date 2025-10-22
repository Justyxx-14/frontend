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
    return httpService.setsElectionSecret(
      gameId,
      setId,
      targetPlayerId,
      selectedSecretId
    );
  };

  const _effectChooseOtherPlayer = async cards => {
    const selectedPlayerId = await _promptForPlayer("Select a player");

    const cardIds = cards.map(card => card.id);

    return httpService.playDetectiveEffect(gameId, cardIds, playerId, {
      target_player: selectedPlayerId
    });
  };

  const _effectChooseOtherSecret = async (cards, isPyne) => {
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

    const cardIds = cards.map(card => card.id);

    return httpService.playDetectiveEffect(gameId, cardIds, playerId, {
      target_player: selectedPlayerId,
      target_secret: selectedSecretId
    });
  };

  const _activateSet = async (typeSet, cards) => {
    switch (typeSet) {
      case "TB":
      case "LEB":
      case "TUB":
      case "MS":
      case "HARLEY_MS":
      case "SIBLINGS_B":
        return await _effectChooseOtherPlayer(cards);

      case "HP":
      case "MM":
        return await _effectChooseOtherSecret(cards, false);

      case "PP":
        return await _effectChooseOtherSecret(cards, true);

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

  return {
    playSet,
    callOtherSecrets
  };
};
