import toast from "react-hot-toast";

export function UseCardPlay({
  cardActionsService,
  cardDetectiveService,
  inventoryCards,
  selectedCardIds,
  setInventoryCards,
  setSelectedCardIds,
  turnState
}) {
  const handlePlayCard = async () => {
    if (
      turnState === "DRAWING_CARDS" ||
      turnState === "DISCARDING" ||
      turnState === "END_TURN" ||
      turnState === "CHOOSING_SECRET"||
      turnState === "CARD_TRADE_PENDING"
    ) {
      return toast.error("You can't play a card in this moment");
    }
    if (!cardActionsService) return toast.error("The game isn't ready");

    const cardsSelected = Array.from(selectedCardIds);
    const selectedCards = inventoryCards.filter(card =>
      cardsSelected.includes(card.id)
    );

    if (selectedCards.length === 1) {
      const card = selectedCards[0];
      if (card.type === "EVENT") {
        try {
          const result = await cardActionsService.playCardEvent(card);
          if (result) {
            if (card.name === "E_LIA")
              setInventoryCards(prev => [...prev, result]);

            setSelectedCardIds(new Set());
            setInventoryCards(prev => prev.filter(c => c.id !== card.id));
          } else {
            toast.error(
              "The player you selected doesn't meet the requirements to play this card"
            );
          }
        } catch (error) {
          toast.error("The card could not be played");
          console.error(error.message);
        }
        return;
      }
      if (card.type === "DETECTIVE") {
        try {
          const result = await cardDetectiveService.addDetective(card);
          if (result === "Player has not sets" || result === "You don't have sets"){
            toast.error(result);
            return;
          }
          if (result) {
            setSelectedCardIds(new Set());
            setInventoryCards(prev => prev.filter(c => c.id !== card.id));
          } else {
            toast.error("Detective and set are not the same type.");
          }
        } catch (error) {
          throw new Error("Could not add detective.", error);
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
      } else {
        toast.error("The player you selected has no secrets available");
      }
    } catch (error) {
      toast.error(error.message || "The cards could not be played");
    }
  };

  return { handlePlayCard };
}
