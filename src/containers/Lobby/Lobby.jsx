import { useGame } from "@/context/useGame";
import { useState, useEffect } from "react";
import { createWSService } from "@/services/WSService";
import { createHttpService } from "@/services/HttpService";
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
  const [httpService] = useState(() => createHttpService());

  const leaveGame = async () => {
    try {
      // USAR EL HTTP SERVICE PARA LLAMAR AL ENDPOINT
      await httpService.leaveGame(currentGame.id, idPlayer);
      // NO navegar inmediatamente aquí, esperar el mensaje WebSocket
    } catch (error) {
      console.error("Error leaving the game: ", error);
      // En caso de error, redirigir de todas formas
      navigate('/');
    }
  };

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

    // Nuevos manejadores para eventos de abandono
    const handlePlayerLeft = (data) => {
      if (data.game_id === currentGame.id) {
        // Si el jugador que se fue es el actual usuario, redirigir
        if (data.player_id === idPlayer) {
          navigate('/');
        } else {
          // Actualizar la lista de jugadores removiendo al que se fue
          setDataPlayers((prev) => {
            const newData = { ...prev };
            delete newData[data.player_id];
            return newData;
          });
        }
      }
    };

    const handleGameCancelled = (data) => {
      if (data.game_id === currentGame.id) {
        // El host abandonó, redirigir a todos los jugadores
        navigate('/');
      }
    };

    setTimeout(() => {
      wsService.connect(currentGame.id);
    }, 500);

    wsService.on("playerJoined", handleJoin);
    wsService.on("leavePlayerFromGame", handleLeave);
    wsService.on("GameStarted", handleStartGame);
    wsService.on("playerLeft", handlePlayerLeft);
    wsService.on("GameCancelled", handleGameCancelled);
    wsService.on("disconnect", () => {
      console.warn("WebSocket disconnected");
    });

    return () => {
      wsService.off("playerJoined", handleJoin);
      wsService.off("leavePlayerFromGame", handleLeave);
      wsService.off("GameStarted", handleStartGame);
      wsService.off("playerLeft", handlePlayerLeft);
      wsService.off("GameCancelled", handleGameCancelled);
      wsService.disconnect();
    };
  }, [currentGame?.id, idPlayer]);


  return (
    <LobbyLayout
      currentGame={currentGame}
      dataPlayers={dataPlayers}
      startGame={startGame}
      idPlayer={idPlayer}
      leaveGame={leaveGame}
    />
  );
}
