import { useGame } from "@/context/useGame";
import { useState, useEffect } from "react";
import { createWSService } from "@/services/WSService";
import { useNavigate } from "react-router-dom";
import LobbyLayout from "./components/LobbyLayout";

export default function Lobby() {
  const {
    currentGame,
    dataPlayers,
    setDataPlayers,
    startGameContext,
    idPlayer
  } = useGame();
  const [wsService] = useState(() => createWSService());

  const startGame = async () => {
    try {
      await startGameContext(currentGame.id);
    } catch (error) {
      console.error("Error starting the game: ", error);
    }
  };

  const navigate = useNavigate();

  useEffect(() => {
    if (!idPlayer || !currentGame?.id) return;

    const handleJoin = (data) => {
      if (data.game_id === currentGame.id) {
        setDataPlayers((prev) => ({
          ...prev,
          [data.player_id]: data.player_name,
        }));
      }
    };

    const handleLeave = (data) => {
      if (data.id === currentGame.id) {
        setDataPlayers((prev) => ({
          ...prev,
          [data.player_id]: data.player_name,
        }));
      }
    };

    const handleStartGame = (data) => {
      if (data.id === currentGame.id) {
        navigate(`/game/${currentGame.id}`);
      }
    };

    setTimeout(() => {
      wsService.connect(currentGame.id);
    }, 500);

    wsService.on("playerJoined", handleJoin);
    wsService.on("leavePlayerFromGame", handleLeave);
    wsService.on("GameStarted", handleStartGame);
    wsService.on("disconnect", () => {
      console.warn("WebSocket disconnected");
    });

    return () => {
      wsService.off("playerJoined", handleJoin);
      wsService.off("leavePlayerFromGame", handleLeave);
      wsService.off("GameStarted", handleStartGame);
      wsService.disconnect();
    };
  }, [currentGame?.id, idPlayer]);


  return (
    <LobbyLayout
      currentGame={currentGame}
      dataPlayers={dataPlayers}
      startGame={startGame}
      idPlayer={idPlayer}
    />
  );
}
