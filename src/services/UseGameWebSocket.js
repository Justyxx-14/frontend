import { useEffect } from "react";
import toast from "react-hot-toast";

export function UseGameWebSocket({
  wsService,
  httpService,
  currentGame,
  idPlayer,
  dataPlayers,
  setCurrentTurnID,
  setIsCurrentTurn,
  reloadPlayerData,
  navigate,
  gameId,
  cardDetectiveService,
  cardActionsService,
  setCanNoSoFast,
  setNsfResetKey
}) {
  useEffect(() => {
    const init = async () => {
      if (!idPlayer || !currentGame?.id) return;

      try {
        wsService.connect(currentGame.id);

        wsService.on("turnChange", data => {
          setCurrentTurnID(data.player_id);
          setIsCurrentTurn(data.player_id === idPlayer);
        });

        wsService.on("updateDraft", data => {
          reloadPlayerData();
          const playerName = dataPlayers?.[data.player_id];
          if (playerName && data.player_id !== idPlayer) {
            toast.success(`${playerName} drew 1 card from the draft`);
          }
        });

        wsService.on("playerDrawCards", data => {
          reloadPlayerData();
          const playerName = dataPlayers?.[data.id_player];
          if (playerName && data.id_player !== idPlayer) {
            toast.success(
              `${playerName} drew ${data.n_cards} card${
                data.n_cards > 1 ? "s" : ""
              } from the regular deck`
            );
          }
        });

        wsService.on("playSet", async data => {
          reloadPlayerData();
          const playerName = dataPlayers?.[data.player_id];
          const targetName = dataPlayers?.[data.target_player];
          toast.dismissAll();
          if (playerName && idPlayer !== data.player_id)
            toast.success(`${playerName} played a set to ${targetName}`);
        });

        wsService.on("playEvent", async data => {
          reloadPlayerData();
          const playerName = dataPlayers?.[data.id_player];
          const targetName = dataPlayers?.[data.target_player];
          toast.dismissAll();
          if (idPlayer !== data.id_player) {
            if (targetName) {
              toast.success(`${playerName} played an event to ${targetName}`);
            } else {
              const eventName = data.last_card?.description
                ? data.last_card.description
                : "an event";
              toast.success(`${playerName} played ${eventName}`);
            }
          } else {
            toast.success("the event card was played");
          }

          if (data.name === "Card Trade" && idPlayer === data.target_player) {
            const selectedCard = await cardActionsService.ECTselection(
              playerName
            );
            try {
              httpService.resolveCardTrade({
                gameId: currentGame.id,
                playerId: idPlayer,
                targetCardId: selectedCard,
                eventId: data.last_card.id
              });
            } catch (error) {
              console.warn(error);
              return;
            }
          }
        });

        wsService.on("playerCardDiscarded", data => {
          if (data?.last_card) {
            reloadPlayerData();
          }
        });

        wsService.on("targetPlayerElection", async data => {
          if (data.target_player === idPlayer) {
            try {
              const result = await cardDetectiveService.callOtherSecrets(
                data.set_id,
                data.target_player
              );
              if (result) {
                toast.success(`Your secret was revealed`);
              } else {
                toast.info("The player you selected has no secrets available");
              }
            } catch (error) {
              toast.error(error?.message || "error");
            }
          }
        });

        wsService.on("passingPhaseStarted", async data => {
          try {
            const res = await cardActionsService.callPassCard(data.direction);
            toast.success(`${res.description} goes to the ${data.direction}`);
          } catch (error) {
            toast.error(error?.message || "error");
          }
        });

        wsService.on("passingPhaseExecuted", async data => {
          reloadPlayerData();
          toast.dismissAll();
          toast.success(data.message);
        });

        wsService.on("votingPhaseStarted", async data => {
          try {
            const res = await cardActionsService.callVotePlayer(data);
            if (res) toast.success(`Vote taken`);
          } catch (error) {
            toast.error(error?.message || "error");
          }
        });

        wsService.on("votingPhaseExecuted", async data => {
          toast.dismissAll();
          try {
            if (data.player_to_reveal_id === idPlayer) {
              const res = await cardActionsService.callOtherSecrets(
                data.player_to_reveal_id,
                "P_Y_S"
              );
              reloadPlayerData();
            }
          } catch (error) {
            toast.error(error?.message || "error");
          }
        });

        wsService.on("playerHasVoted", async data => {
          toast.dismissAll();
          try {
            if (data.player_id === idPlayer) {
              toast.loading(`Waiting for other players to vote...`, {
                duration: Infinity
              });
            }
          } catch (error) {
            toast.error(error?.message || "error");
          }
        });

        wsService.on("secretRevealed", async data => {
          toast.dismissAll();
          const playerName = dataPlayers?.[data.player_id];
          toast.success(`${playerName} revealed a secret card`);
        });

        wsService.on("cardTradeResolved", async data => {
          reloadPlayerData();
          const playerTurnName = dataPlayers?.[data.player_id];
          const playerTargetName = dataPlayers?.[data.target_player];
          if (idPlayer != data.player_id && idPlayer != data.target_player) {
            toast.dismissAll();
            toast.success(
              `${playerTurnName} and ${playerTargetName} traded cards`
            );
          } else {
            toast.dismissAll();
            toast.success(
              `${
                data.player_id === idPlayer ? playerTargetName : playerTurnName
              } and you trade cards`
            );
          }
        });

        wsService.on("endTimer", async data => {
          if (data.player_id === idPlayer) {
            toast.dismissAll();
            toast.error("Time's up! Your turn was skipped");
            reloadPlayerData();
          }
        });

        wsService.on("waitingForCancellationEvent", async () => {
          setCanNoSoFast(true);
        });

        wsService.on("waitingForCancellationSet", async () => {
          setCanNoSoFast(true);
        });

        wsService.on("waitFinished", async () => {
          setCanNoSoFast(false);
        });

        wsService.on("cancellationStopped", async () => {
          toast.success("The action was cancelled");
        });

        wsService.on("actionRequiredChooseSecret", async data => {
          const playerWhoRecived = dataPlayers?.[data.target_player_id];
          const playerWhoSent = dataPlayers?.[data.actor_player_id];
          if (
            data.trigger_card_name === "Blackmailed" &&
            data.actor_player_id === idPlayer
          ) {
            try {
              const result = await cardActionsService.deviousSent(
                data,
                playerWhoRecived
              );
              if (result === "Player has not secrets") {
                toast.error(result);
              }
              reloadPlayerData();
            } catch (error) {
              toast.error(error?.message || "error");
            }
          } else {
            toast.success(
              `${playerWhoSent} saw one of ${playerWhoRecived}'s secrets`
            );
          }
        });

        wsService.on("notSoFastPlayed", async data => {
          setNsfResetKey(prev => prev + 1);
          const playerName = dataPlayers?.[data.player_id];
          if (playerName)
            toast.success(`${playerName} played a No So Fast card`);
        });

        wsService.on("sfpPending", async data => {
          const playersWhoMustReveal = data.players_id;
          if (playersWhoMustReveal.includes(idPlayer)) {
            try {
              const result = await cardActionsService.callOtherSecrets(
                idPlayer,
                "S_F_P"
              );
              if (result) {
                toast.success("Secret revealed");
              }
              reloadPlayerData();
            } catch (error) {
              toast.error(error?.message || "error");
            }
          }
          const playersNames = playersWhoMustReveal
            ?.map(id => dataPlayers?.[id])
            .filter(Boolean)
            .join(", ");

          toast.dismissAll();
          toast.success(`${playersNames} revealed a secret`);
        });

        wsService.on("gameEnd", data => {
          navigate(`/game/${gameId}/endGame`, {
            state: { gameResult: data, currentPlayerId: idPlayer }
          });
        });

        wsService.on("disconnect", () =>
          console.warn("WebSocket disconnected")
        );
      } catch (error) {
        console.error("Failed to initialize websocket handlers", error);
      }
    };

    init();

    return () => {
      try {
        wsService.disconnect();
      } catch (e) {
        console.warn(e);
      }
    };
  }, [idPlayer, currentGame?.id, wsService, httpService, dataPlayers]);
}
