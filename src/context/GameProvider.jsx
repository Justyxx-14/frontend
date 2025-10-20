import { useState, useEffect, useRef } from "react";
import { GameContext } from "./gameContext";
import { createHttpService } from "@services/HttpService";

const httpService = createHttpService();

export const GameProvider = ({ children }) => {
  // initial states from sessionStorage
  const [user, setUser] = useState(() => {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  const [currentGame, setCurrentGame] = useState(() => {
    const raw = sessionStorage.getItem("currentGame");
    return raw ? JSON.parse(raw) : null;
  });

  const [idPlayer, setIdPlayer] = useState(() =>
    sessionStorage.getItem("idPlayer")
  );

  const [dataPlayers, setDataPlayers] = useState(() => {
    const saved = sessionStorage.getItem("dataPlayers");
    return saved ? JSON.parse(saved) : {};
  });

  const prevGameId = useRef(currentGame?.id ?? null);

  // Persistencia en sessionStorage
  useEffect(() => {
    if (user) sessionStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    if (currentGame) {
      sessionStorage.setItem("currentGame", JSON.stringify(currentGame));
    }
  }, [currentGame]);

  useEffect(() => {
    if (
      prevGameId.current &&
      currentGame?.id &&
      currentGame.id !== prevGameId.current
    ) {
      setDataPlayers({});
    }
    prevGameId.current = currentGame?.id ?? null;
  }, [currentGame]);

  useEffect(() => {
    if (idPlayer) sessionStorage.setItem("idPlayer", idPlayer);
  }, [idPlayer]);

  useEffect(() => {
    if (dataPlayers)
      sessionStorage.setItem("dataPlayers", JSON.stringify(dataPlayers));
  }, [dataPlayers]);

  const joinGameContext = async (game, user) => {
    try {
      const responseJoin = await httpService.joinGame(game.id, user);
      const response = await httpService.getGameInfo(game.id);
      setCurrentGame(response);
      for (const playerId of response.players_ids) {
        const infoPlayer = await httpService.getPlayers(playerId);
        setDataPlayers(prev => ({
          ...prev,
          [playerId]: infoPlayer.name
        }));
      }

      setIdPlayer(responseJoin.player_id);
      return response;
    } catch (error) {
      console.error("Failed to join game:", error);
      throw error;
    }
  };

  const createGameContext = async (game, user) => {
    try {
      sessionStorage.clear();
      const response = await httpService.createGame(game, user);
      setCurrentGame(response);
      setDataPlayers(prev => ({
        ...prev,
        [response.host_id]: user.name
      }));
      setIdPlayer(response.host_id);
      return response;
    } catch (error) {
      console.error("Failed to create game:", error);
      throw error;
    }
  };

  const discardCardsContext = async (gameId, playerId, cardId) => {
    try {
      const response = await httpService.discardCards(gameId, playerId, cardId);
      return response;
    } catch (error) {
      console.error("Failed to move card:", error);
      throw error;
    }
  };

  const startGameContext = async gameId => {
    try {
      await httpService.startGame(gameId);
      const updatedGame = await httpService.getGameInfo(gameId);
      setCurrentGame(updatedGame);
    } catch (error) {
      console.error("Failed to start game:", error);
      throw error;
    }
  };

  const cardsByPlayerContext = async (gameId, playerId) => {
    try {
      const response = await httpService.getCardsByPlayer(gameId, playerId);
      return response;
    } catch (error) {
      console.error("Failed to get cards by player:", error);
      throw error;
    }
  };

  return (
    <GameContext.Provider
      value={{
        user,
        setUser,
        currentGame,
        dataPlayers,
        setDataPlayers,
        joinGameContext,
        createGameContext,
        idPlayer,
        discardCardsContext,
        cardsByPlayerContext,
        startGameContext
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
