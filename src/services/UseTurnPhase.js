import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

/*:
  IDLE
  DRAWING_CARDS 
  DISCARDING   
  CHOOSING_SECRET
  PASSING_CARDS 
  END_TURN
*/

export function UseTurnPhase({
  currentGame,
  httpService,
  idPlayer,
  inventoryCards,
  inventoryDraftCards,
  inventorySecrets,
  setCurrentTurnID,
  setIsCurrentTurn,
  currentTurnID
}) {
  const [turnInfo, setTurnInfo] = useState(null);
  const [initialRemainingTime, setInitialRemainingTime] = useState(0);
  const waitingToastId = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      if (!currentGame?.id) return;

      try {
        const newTurnInfo = await httpService.getTurnGame(currentGame.id);

        if (isMounted) {
          setCurrentTurnID(newTurnInfo.current_turn);
          setIsCurrentTurn(newTurnInfo.current_turn === idPlayer);
          setInitialRemainingTime(newTurnInfo.remaining_time);

          setTurnInfo(newTurnInfo);

          const waitingMap = {
            CHOOSING_SECRET: "a secret",
            CARD_TRADE_PENDING: "a card to trade"
          };

          const waitingOtherChoose = waitingMap[newTurnInfo.turn_state] ?? null;

          const isWaitingForOther =
            waitingOtherChoose != null &&
            newTurnInfo.target_player_id !== idPlayer;

          if (!isWaitingForOther && waitingToastId.current !== null) {
            toast.dismiss(waitingToastId.current);
            waitingToastId.current = null;
          }

          if (isWaitingForOther && waitingToastId.current === null) {
            try {
              const player = await httpService.getPlayerById(
                newTurnInfo.target_player_id
              );
              if (isMounted && waitingToastId.current === null) {
                waitingToastId.current = toast.loading(
                  `Waiting for ${player.name} to choose ${waitingOtherChoose}...`,
                  {
                    duration: Infinity
                  }
                );
              }
            } catch (playerError) {
              console.error(
                "Could not get player name for toast:",
                playerError
              );
              if (isMounted && waitingToastId.current === null) {
                waitingToastId.current = toast.loading(
                  `Waiting for another player to choose a secret...`,
                  {
                    duration: Infinity
                  }
                );
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching turn info in UseTurnPhase:", error);
        if (waitingToastId.current !== null) {
          toast.dismiss(waitingToastId.current);
          waitingToastId.current = null;
        }
      }
    }
    fetchData();

    return () => {
      isMounted = false;
      if (waitingToastId.current !== null) {
        toast.dismiss(waitingToastId.current);
        waitingToastId.current = null;
      }
    };
  }, [
    currentGame?.id,
    httpService,
    idPlayer,
    inventoryCards,
    inventoryDraftCards,
    inventorySecrets,
    currentTurnID,
    setCurrentTurnID,
    setIsCurrentTurn
  ]);

  return {
    turnInfo,
    turnState: turnInfo?.turn_state || null,
    setTurnState: newState =>
      setTurnInfo(prev => ({ ...prev, turn_state: newState })),
    initialRemainingTime,
    timerIsPaused: turnInfo?.timer_is_paused
  };
}
