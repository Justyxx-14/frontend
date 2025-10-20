import { useRef } from "react";

import { useGame } from "@/context/useGame";
import MenuLayout from "./components/MenuLayout";
import { useEffect, useState } from "react";
import { createWSService } from "@/services/WSService";
import { createHttpService } from "@/services/HttpService";
import { useNavigate } from "react-router-dom";

const Menu = () => {
  const { user, joinGameContext, createGameContext } = useGame();
  const navigate = useNavigate();

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wsService] = useState(() => createWSService());
  const [httpService] = useState(() => createHttpService());

  const formRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        // Load games
        const gamesData = await httpService.getGames().catch(() => []);

        gamesData.forEach((game) => {
          game.countPlayers = game.players_ids.length;
        });

        setGames(gamesData);

        // Initialize WebSocket
        setTimeout(() => {
          if (!wsService.isConnected) {
            wsService.connect();
          } else {
            console.warn(
              "WebSocket is already connected. Reusing existing connection."
            );
          }
        }, 500);

        wsService.on("gameAdd", (newGame) => {
          newGame = { ...newGame, countPlayers: newGame.players_ids.length };
          setGames((prev) => {
            const exists = prev.some((game) => game.id === newGame.id);
            return exists ? prev : [...prev, newGame];
          });
        });

        wsService.on("joinPlayerToGame", (data) => {
          const { id, players_ids } = data;
          setGames((prev) =>
            prev.map((game) =>
              game.id === id
                ? { ...game, countPlayers: players_ids.length }
                : game
            )
          );
        });

        wsService.on("gameUnavailable", (data) => {
          const { id } = data;
          setGames((prev) => prev.filter((game) => game.id !== id));
        });
      } catch (error) {
        console.error("Failed to initialize app:", error);
      } finally {
        setLoading(false);
      }
    };

    init();

    // Cleanup WebSocket on unmount
    return () => {
      wsService.disconnect();
    };
  }, [httpService, wsService]);

  const createGame = async (game) => {
    if (!user?.name || !user?.birthday) {
      formRef.current?.querySelector("input")?.focus();
      alert("Debes completar el registro antes de unirte a una partida");
      return;
    }

    try {
      const created = await createGameContext(game, user);
      const gameId = created?.id || created?.game_id;
      if (gameId) navigate(`/lobby/${gameId}`);
    } catch (error) {
      console.error("Error creando partida:", error);
    }
  };

  const joinGame = async (game) => {
    if (!user?.name || !user?.birthday) {
      formRef.current?.querySelector("input")?.focus();
      alert("Debes completar el registro antes de unirte a una partida");
      return;
    }

    try {
      const joined = await joinGameContext(game, user);
      const gameId = joined?.id || joined?.game_id;
      if (gameId) navigate(`/lobby/${gameId}`);
    } catch (error) {
      console.error("Error uniéndote a la partida:", error);
    }
  };

  if (loading) {
    return (
      <div
        role="status"
        className="fixed inset-0 bg-black flex justify-center items-center z-50"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <MenuLayout
      games={games}
      formRef={formRef}
      joinGame={joinGame}
      createGame={createGame}
    />
  );
};

export default Menu;
