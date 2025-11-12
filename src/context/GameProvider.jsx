import { useState, useEffect } from "react";
import { GameContext } from "./gameContext";
import { createHttpService } from "@/services/HttpService";

const httpService = createHttpService();

export const GameProvider = ({ children }) => {
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

  useEffect(() => {
    if (user) sessionStorage.setItem("user", JSON.stringify(user));
    else sessionStorage.removeItem("user");
  }, [user]);

  useEffect(() => {
    if (currentGame) {
      sessionStorage.setItem("currentGame", JSON.stringify(currentGame));
    } else {
      sessionStorage.removeItem("currentGame");
    }
  }, [currentGame]);

  useEffect(() => {
    if (idPlayer) sessionStorage.setItem("idPlayer", idPlayer);
    else sessionStorage.removeItem("idPlayer");
  }, [idPlayer]);

  useEffect(() => {
    if (dataPlayers && Object.keys(dataPlayers).length > 0) {
      sessionStorage.setItem("dataPlayers", JSON.stringify(dataPlayers));
    } else {
      sessionStorage.removeItem("dataPlayers");
    }
  }, [dataPlayers]);

  const joinGameContext = async (game, user, password = null) => {
    try {
      console.log("🔍 GameProvider - joinGameContext called with:", { 
        gameId: game.id, 
        userName: user.name,
        password 
      });

      const responseJoin = await httpService.joinGame(game.id, user, password);
      const responseGameInfo = await httpService.getGameInfo(game.id);
      setCurrentGame(responseGameInfo);

      const playerPromises = responseGameInfo.players_ids.map(playerId =>
        httpService.getPlayers(playerId)
      );

      const results = await Promise.allSettled(playerPromises);

      const playersMap = {};
      results.forEach((result, index) => {
        const playerId = responseGameInfo.players_ids[index];

        if (
          result.status === "fulfilled" &&
          result.value &&
          result.value.name
        ) {
          playersMap[playerId] = result.value.name;
        } else {
          playersMap[playerId] = "Unknown";
          if (result.status === "rejected") {
            console.error(
              `Failed to fetch info for player ${playerId}:`,
              result.reason
            );
          }
        }
      });

      setDataPlayers(playersMap);

      setIdPlayer(responseJoin.player_id);
      return responseGameInfo;
    } catch (error) {
      console.error("Failed to join game:", error);
      setDataPlayers({});
      setCurrentGame(null);
      setIdPlayer(null);
      throw error;
    }
  };

  const createGameContext = async (game, user) => {
    try {
      sessionStorage.clear();
      const response = await httpService.createGame(game, user);
      setCurrentGame(response);
      setDataPlayers({ [response.host_id]: user.name });
      setIdPlayer(response.host_id);
      return response;
    } catch (error) {
      console.error("Failed to create game:", error);
      setDataPlayers({});
      setCurrentGame(null);
      setIdPlayer(null);
      throw error;
    }
  };

  const discardCardsContext = async (gameId, playerId, cardIds) => {
    try {
      const response = await httpService.discardCards(
        gameId,
        playerId,
        cardIds
      );
      return response;
    } catch (error) {
      console.error("Failed to discard card(s):", error);
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
        setCurrentGame,
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
