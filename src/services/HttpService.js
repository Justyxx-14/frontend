const createHttpService = () => {
  const baseUrl = import.meta.env.VITE_SERVER_URI || "http://localhost:8000";

  const request = async (endpoint, options = {}) => {
    const url = `${baseUrl}${endpoint}`;
    const config = {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = {
          detail: `Error HTTP: ${response.status} - ${response.statusText}`
        };
      }

      const error = new Error(
        errorData.detail || "Ocurrió un error en la solicitud."
      );

      error.response = {
        data: errorData,
        status: response.status
      };

      throw error;
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  };

  const getGames = async () => {
    return request("/games", { method: "GET" });
  };

  const getGameInfo = async gameID => {
    return request(`/games/${gameID}`, { method: "GET" });
  };

  const getPlayers = async gameID => {
    return request(`/players/${gameID}`, { method: "GET" });
  };

  const getCardsByPlayer = async (gameId, playerId) => {
    const url = `/cards?game_id=${gameId}&owner=PLAYER&player_id=${playerId}`;
    return await request(url, {
      method: "GET"
    });
  };

  const joinGame = async (gameId, user) => {
    return await request(`/games/${gameId}/players`, {
      method: "POST",
      body: JSON.stringify({ name: user.name, birthday: user.birthday })
    });
  };

  const createGame = async (game, user) => {
    const body = {
      name: game.name,
      host_name: user.name,
      birthday: user.birthday,
      min_players: game.min,
      max_players: game.max
    };

    const newGame = await request("/games", {
      method: "POST",
      body: JSON.stringify(body)
    });

    return newGame;
  };

  const startGame = async gameId => {
    return await request(`/games/${gameId}/start`, {
      method: "POST"
    });
  };

  const getTurnGame = async gameId => {
    return await request(`/games/turn/${gameId}`, {
      method: "GET"
    });
  };

  const nextTurnGame = async gameId => {
    return await request(`/games/turn/${gameId}`, {
      method: "POST"
    });
  };

  const discardCards = async (gameId, idPlayer, cardIds) => {
    return await request(`/cards/discard/${gameId}`, {
      method: "PUT",
      body: JSON.stringify({
        player_id: idPlayer,
        id_cards: cardIds
      })
    });
  };

  const getLastDiscardedCard = async gameId => {
    return await request(`/cards/top_discard/${gameId}?n_cards=1`, {
      method: "GET"
    });
  };

  const getDraftCards = async gameId => {
    return await request(`/cards/draft/${gameId}`, {
      method: "GET"
    });
  };

  const regularDrawCards = async (gameId, idPlayer, count) => {
    return await request(`/cards/draw/${gameId}`, {
      method: "PUT",
      body: JSON.stringify({
        player_id: idPlayer,
        n_cards: count
      })
    });
  };

  const drawDraftCard = async (gameId, cardID, playerID) => {
    return await request(`/cards/draft/${gameId}`, {
      method: "PUT",
      body: JSON.stringify({
        player_id: playerID,
        card_id: cardID
      })
    });
  };

  const getSecretsGame = async (gameId, playerId) => {
    const url = `/secrets?game_id=${gameId}&player_id=${playerId}`;
    return await request(url, {
      method: "GET"
    });
  };

  const getSets = async (gameId, playerId, setId = null) => {
    const url = `/sets?game_id=${gameId}&player_id=${playerId}`;
    if (setId) {
      url += `&set_id=${setId}`;
    }
    return await request(url, {
      method: "GET",
    });
  };

  const playCardEvent = async (
    gameId,
    eventID,
    playerID,
    targetPlayer = null,
    eventCode
  ) => {
    return await request(`/cards/play/${eventCode}/${gameId}`, {
      method: "PUT",
      body: JSON.stringify({
        player_id: playerID,
        event_id: eventID,
        target_player: targetPlayer
      })
    });
  };

  const verifySetDetective = async cardIds => {
    const params = new URLSearchParams();
    cardIds.forEach(card => {
      params.append("cards", card.id);
    });

    const url = `/sets/verify/?${params.toString()}`;
    return await request(url, {
      method: "GET"
    });
  };

  const playDetectiveEffect = async (gameId, cardIds, playerId, payload) => {
    const body = {
      player_id: playerId,
      cards: cardIds,
      target_player_id: payload.target_player
    };

    if (payload.target_secret) {
      body.secret_id = payload.target_secret;
    }

    return await request(`/sets/play/${gameId}`, {
      method: "POST",
      body: JSON.stringify(body)
    });
  };

  const setsElectionSecret = async (
    gameId,
    setId,
    playerId,
    selectedSecretId
  ) => {
    return await request(`/sets/election_secret/${gameId}`, {
      method: "POST",
      body: JSON.stringify({
        set_id: setId,
        player_id: playerId,
        secret_id: selectedSecretId
      })
    });
  };

  return {
    createGame,
    joinGame,
    getGames,
    getPlayers,
    getGameInfo,
    startGame,
    getCardsByPlayer,
    discardCards,
    getTurnGame,
    nextTurnGame,
    getSecretsGame,
    getSets,
    regularDrawCards,
    getDraftCards,
    drawDraftCard,
    getLastDiscardedCard,
    playCardEvent,
    verifySetDetective,
    playDetectiveEffect,
    setsElectionSecret
  };
};

export { createHttpService };
