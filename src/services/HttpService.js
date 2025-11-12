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

  const getPlayerById = async playerId => {
    return request(`/players/${playerId}`, { method: "GET" });
  };

  const getCardsByPlayer = async (gameId, playerId) => {
    const url = `/cards?game_id=${gameId}&owner=PLAYER&player_id=${playerId}`;
    return await request(url, {
      method: "GET"
    });
  };

  const joinGame = async (gameId, user, password = null) => {
    const requestBody = {
      name: user.name,
      birthday: user.birthday
    };

    let url = `/games/${gameId}/players`;

    // Agregar password como query parameter
    if (password !== null) {
      url += `?password=${encodeURIComponent(password)}`;
    }

    return await request(url, {
      method: "POST",
      body: JSON.stringify(requestBody)
    });
  };

  const createGame = async (game, user) => {
    const body = {
      name: game.name,
      password: game.password,
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

  const getLastDiscardedCards = async (gameId, nCards) => {
    return await request(`/cards/top_discard/${gameId}?n_cards=${nCards}`, {
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

  const playCardEvent = async payload => {
    const { eventCode, gameId } = payload;

    const body = {
      player_id: payload.playerId,
      event_id: payload.eventId,
      target_player: payload.targetPlayer || null,
      card_id: payload.cardId || null,
      secret_id: payload.secretId || null,
      set_id: payload.setId || null,
      requested_card_code: payload.requestesCardCode || null,
      target_card_id: payload.targetCardId || null,
      offered_card_id: payload.offeredCardId || null,
      direction: payload.direction || null
    };

    return await request(`/cards/play/${eventCode}/${gameId}`, {
      method: "PUT",
      body: JSON.stringify(body)
    });
  };

  const selectCardForPassing = async payload => {
    const { gameId } = payload;

    const body = {
      player_id: payload.playerId,
      card_id: payload.cardId
    };
    return await request(`/cards/passing/${gameId}`, {
      method: "PUT",
      body: JSON.stringify(body)
    });
  };

  const resolveCardTrade = async payload => {
    const { gameId } = payload;
    const body = {
      player_id: payload.playerId,
      target_card_id: payload.targetCardId,
      event_card_id: payload.eventId
    };
    return await request(`/cards/play/E_CT/${gameId}/selection`, {
      method: "PUT",
      body: JSON.stringify(body)
    });
  };

  const viewSecret = async (secretId) => {
    return await request(`/secrets/${secretId}/view`, {
      method: "GET"
    });
  }

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

  const addDetectiveEffect = async (gameId, cardId, playerId, payload) => {
    const params = new URLSearchParams({
      game_id: gameId,
      player_id: playerId,
      target_player_id: payload.target_player
    });
    if (payload.target_secret) {
      params.append("secret_id", payload.target_secret);
    }

    const url = `/sets/${payload.set_id}/cards/${cardId}?${params.toString()}`;
    return await request(url, { method: "PUT" });
  };

  const addAriadne = async (gameId, setId, playerId, cardId) => {
    const params = new URLSearchParams({
      game_id: gameId,
      player_id: playerId,
      card_id: cardId
    });

    const url = `/sets/ariadne/${setId}?${params.toString()}`;
    return await request(url, { method: "PUT" });
  };

  const setsElectionSecret = async (gameId, payload) => {
    const params = new URLSearchParams();
    if (payload.cardId) params.append("card_id", payload.cardId);

    const url = `/sets/election_secret/${gameId}?${params.toString()}`;
    return await request(url, {
      method: "POST",
      body: JSON.stringify({
        set_id: payload.setId,
        player_id: payload.targetPlayerId,
        secret_id: payload.selectedSecretId
      })
    });
  };

  const getSets = async (gameId, playerId, setId = null) => {
    const params = new URLSearchParams({
      game_id: gameId,
      player_id: playerId
    });
    if (setId) params.append("set_id", setId);

    const url = `/sets?${params.toString()}`;

    return await request(url, { method: "GET" });
  };

  const getPlayerNeighbors = async (gameId, playerId) => {
    return await request(`/games/${gameId}/neighbors/${playerId}`, {
      method: "GET"
    });
  };

  const leaveGame = async (gameId, playerId) => {
    return await request(`/games/${gameId}/players/${playerId}`, {
      method: "DELETE"
    });
  };

  const getSocialDisgraceByGame = async gameId => {
    let url = `/secrets/social_disgrace?game_id=${gameId}`;
    return await request(url, {
      method: "GET"
    });
  };

  const votePlayer = async payload => {
    const { gameId } = payload;

    const body = {
      player_id: payload.playerId,
      target_player_id: payload.targetPlayerId
    };

    return await request(`/cards/vote/${gameId}`, {
      method: "PUT",
      body: JSON.stringify(body)
    });
  };

  const revealSecretAction = async payload => {
    const { gameId } = payload;
    const { cardType } = payload;

    const body = {
      player_id: payload.targetPlayerId,
      secret_id: payload.selectedSecretId
    };
    switch (cardType){
      case "P_Y_S":
        return await request(`/secrets/reveal_for_pys/${gameId}`, {
          method: "PUT",
          body: JSON.stringify(body)
        });
      case "S_F_P":
        return await request(`/secrets/reveal_for_sfp/${gameId}`, {
          method: "PUT",
          body: JSON.stringify(body)
        });
    }
  };

  const playCardNSF = async payload => {
    const { gameId } = payload;

    const body = {
      player_id: payload.playerId,
      card_id: payload.eventId
    };

    return await request(`/cards/play-no-so-fast/${gameId}`, {
      method: "PUT",
      body: JSON.stringify(body)
    });
  };

  return {
    createGame,
    joinGame,
    getGames,
    getPlayers,
    getPlayerById,
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
    getLastDiscardedCards,
    playCardEvent,
    verifySetDetective,
    viewSecret,
    playDetectiveEffect,
    addDetectiveEffect,
    addAriadne,
    setsElectionSecret,
    selectCardForPassing,
    getPlayerNeighbors,
    votePlayer,
    revealSecretAction,
    resolveCardTrade,
    leaveGame,
    getSocialDisgraceByGame,
    playCardNSF
  };
};

export { createHttpService };
