export const createCardActionsService = ({
  httpService,
  gameId,
  playerId,
  otherPlayers,
  openSelectionModal,
}) => {
  const playCardEvent = async (card) => {
    switch (card.name) {
      case "E_COT":
        return await playECOT(card);
      default:
        console.warn(`The card "${card.description}" don't have an action`);
        return null;
    }
  };

  // if need select something
  const playECOT = (card) => {
    return new Promise((resolve) => {
      openSelectionModal({
        title: "Choose a player to play Cards off the table",
        items: otherPlayers,
        itemType: "player",
        onSelect: (selectedPlayerId) => {
          const result = httpService.playCardEvent(
            gameId,
            card.id,
            playerId,
            selectedPlayerId,
            card.name
          );
          resolve(result);
        },
      });
    });
  };

  return {
    playCardEvent,
  };
};
