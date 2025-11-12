import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHttpService } from "./HttpService";

const originalFetch = global.fetch;
let mockFetch;

beforeEach(() => {
  // Create a new mock for fetch before each test
  mockFetch = vi.fn();
  global.fetch = mockFetch;

  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ success: true }),
    text: async () => "Success"
  });
});

afterEach(() => {
  global.fetch = originalFetch;
});

// Helper to simulate error responses
const mockFetchError = (
  status,
  jsonData = { detail: "Error Detail" },
  ok = false
) => {
  mockFetch.mockResolvedValue({
    ok: ok,
    status: status,
    json: async () => jsonData,
    statusText: `Status ${status}`
  });
};

// Helper to simulate error responses where response.json() fails
const mockFetchErrorWithJsonFailure = status => {
  mockFetch.mockResolvedValue({
    ok: false,
    status: status,
    json: async () => {
      throw new Error("Invalid JSON");
    },
    statusText: `Status ${status}`
  });
};

// Helper to simulate 204 No Content
const mockFetchNoContent = () => {
  mockFetch.mockResolvedValue({
    ok: true,
    status: 204,
    json: async () => null,
    text: async () => ""
  });
};

describe("HttpService", () => {
  let httpService;
  const baseUrl = "http://localhost:8000";

  beforeEach(() => {
    httpService = createHttpService();
  });

  describe("request helper", () => {
    it("should throw an enriched error on non-ok response with JSON body", async () => {
      const errorData = { detail: "Specific Error Message" };
      mockFetchError(400, errorData);

      await expect(httpService.getGames()).rejects.toThrow(errorData.detail);
      try {
        await httpService.getGames();
      } catch (error) {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(400);
        expect(error.response.data).toEqual(errorData);
      }
    });

    it("should throw an enriched error on non-ok response even if JSON parsing fails", async () => {
      mockFetchErrorWithJsonFailure(500);
      const expectedErrorMessage = "Error HTTP: 500 - Status 500";

      await expect(httpService.getGames()).rejects.toThrow(
        expectedErrorMessage
      );
      try {
        await httpService.getGames();
      } catch (error) {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(500);
        expect(error.response.data).toEqual({ detail: expectedErrorMessage });
      }
    });

    it("should return null for 204 No Content status", async () => {
      mockFetchNoContent();
      const result = await httpService.getGames();
      expect(result).toBeNull();
    });
  });

  it("getGames should call request with correct parameters", async () => {
    await httpService.getGames();
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/games`,
      expect.objectContaining({ method: "GET" })
    );
  });

  it("getGameInfo should call request with correct gameID", async () => {
    const gameId = "game123";
    await httpService.getGameInfo(gameId);
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/games/${gameId}`,
      expect.objectContaining({ method: "GET" })
    );
  });

  it("getPlayers should call request with correct gameID", async () => {
    const gameId = "game123";
    await httpService.getPlayers(gameId);
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/players/${gameId}`,
      expect.objectContaining({ method: "GET" })
    );
  });

  it("getCardsByPlayer should call request with correct query parameters", async () => {
    const gameId = "g1";
    const playerId = "p1";
    await httpService.getCardsByPlayer(gameId, playerId);
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/cards?game_id=${gameId}&owner=PLAYER&player_id=${playerId}`,
      expect.objectContaining({ method: "GET" })
    );
  });

  it("joinGame should call request with POST and correct body", async () => {
    const gameId = "g1";
    const user = { name: "Test", birthday: "2000-01-01" };
    await httpService.joinGame(gameId, user);
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/games/${gameId}/players`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: user.name, birthday: user.birthday }),
        headers: expect.objectContaining({ "Content-Type": "application/json" })
      })
    );
  });

  it("createGame should call request with POST and correct body", async () => {
    const game = { name: "My Game", min: 4, max: 6 };
    const user = { name: "Host", birthday: "1999-12-31" };
    const expectedBody = {
      name: game.name,
      host_name: user.name,
      birthday: user.birthday,
      min_players: game.min,
      max_players: game.max
    };
    await httpService.createGame(game, user);
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/games`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(expectedBody),
        headers: expect.objectContaining({ "Content-Type": "application/json" })
      })
    );
  });

  it("startGame should call request with POST and correct gameId", async () => {
    const gameId = "g1";
    await httpService.startGame(gameId);
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/games/${gameId}/start`,
      expect.objectContaining({ method: "POST" })
    );
  });

  it("getTurnGame should call request with GET and correct gameId", async () => {
    const gameId = "g1";
    await httpService.getTurnGame(gameId);
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/games/turn/${gameId}`,
      expect.objectContaining({ method: "GET" })
    );
  });

  it("nextTurnGame should call request with POST and correct gameId", async () => {
    const gameId = "g1";
    await httpService.nextTurnGame(gameId);
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/games/turn/${gameId}`,
      expect.objectContaining({ method: "POST" })
    );
  });

  it("discardCards should call request with PUT and correct body", async () => {
    const gameId = "g1";
    const playerId = "p1";
    const cardIds = ["c1", "c2"];
    const expectedBody = { player_id: playerId, id_cards: cardIds };
    await httpService.discardCards(gameId, playerId, cardIds);
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/cards/discard/${gameId}`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(expectedBody),
        headers: expect.objectContaining({ "Content-Type": "application/json" })
      })
    );
  });

  it("getLastDiscardedCards should call request with GET and correct query param", async () => {
    const gameId = "g1";
    const nCards = 3;
    await httpService.getLastDiscardedCards(gameId, nCards);
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/cards/top_discard/${gameId}?n_cards=${nCards}`,
      expect.objectContaining({ method: "GET" })
    );
  });

  it("getDraftCards should call request with GET and correct gameId", async () => {
    const gameId = "g1";
    await httpService.getDraftCards(gameId);
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/cards/draft/${gameId}`,
      expect.objectContaining({ method: "GET" })
    );
  });

  it("regularDrawCards should call request with PUT and correct body", async () => {
    const gameId = "g1";
    const playerId = "p1";
    const count = 2;
    const expectedBody = { player_id: playerId, n_cards: count };
    await httpService.regularDrawCards(gameId, playerId, count);
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/cards/draw/${gameId}`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(expectedBody),
        headers: expect.objectContaining({ "Content-Type": "application/json" })
      })
    );
  });

  it("drawDraftCard should call request with PUT and correct body", async () => {
    const gameId = "g1";
    const cardId = "draftCard1";
    const playerId = "p1";
    const expectedBody = { player_id: playerId, card_id: cardId };
    await httpService.drawDraftCard(gameId, cardId, playerId);
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/cards/draft/${gameId}`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(expectedBody),
        headers: expect.objectContaining({ "Content-Type": "application/json" })
      })
    );
  });

  it("getSecretsGame should call request with correct query params", async () => {
    const gameId = "g1";
    const playerId = "p1";
    await httpService.getSecretsGame(gameId, playerId);
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/secrets?game_id=${gameId}&player_id=${playerId}`,
      expect.objectContaining({ method: "GET" })
    );
  });

  it("playCardEvent should call request with PUT and full body", async () => {
    const payload = {
      gameId: "g1",
      eventId: "e1",
      playerId: "p1",
      targetPlayer: "p2",
      cardId: "c1",
      secretId: "s1",
      setId: "set1",
      direction: null,
      eventCode: "E_COT"
    };

    const expectedBody = {
      player_id: payload.playerId,
      event_id: payload.eventId,
      target_player: payload.targetPlayer,
      card_id: payload.cardId,
      secret_id: payload.secretId,
      set_id: payload.setId,
      requested_card_code: null,
      target_card_id: null,
      offered_card_id: null,
      direction: payload.direction
    };

    await httpService.playCardEvent(payload);

    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/cards/play/${payload.eventCode}/${payload.gameId}`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(expectedBody),
        headers: expect.objectContaining({
          "Content-Type": "application/json"
        })
      })
    );
  });

  it("playCardEvent should handle null optional parameters correctly", async () => {
    const payload = {
      gameId: "g1",
      eventId: "e2",
      playerId: "p1",
      eventCode: "E_DME"
    };

    const expectedBody = {
      player_id: payload.playerId,
      event_id: payload.eventId,
      target_player: null,
      card_id: null,
      secret_id: null,
      set_id: null,
      requested_card_code: null,
      target_card_id: null,
      offered_card_id: null,
      direction: null
    };

    await httpService.playCardEvent(payload);

    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/cards/play/${payload.eventCode}/${payload.gameId}`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(expectedBody),
        headers: expect.objectContaining({
          "Content-Type": "application/json"
        })
      })
    );
  });

  it("resolveCardTrade should call request with PUT and correct body", async () => {
    const payload = {
      gameId: "g123",
      playerId: "p1",
      targetCardId: "card999",
      eventId: "event777"
    };

    const expectedBody = {
      player_id: payload.playerId,
      target_card_id: payload.targetCardId,
      event_card_id: payload.eventId
    };

    await httpService.resolveCardTrade(payload);

    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/cards/play/E_CT/${payload.gameId}/selection`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(expectedBody),
        headers: expect.objectContaining({
          "Content-Type": "application/json"
        })
      })
    );
  });

  it("viewSecret should call request correctly", async () => {
    const secretId = "s1";
    await httpService.viewSecret(secretId);
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/secrets/${secretId}/view`,
      expect.objectContaining({ method: "GET" })
    );
  });

  it("verifySetDetective should call request with GET and correct query params", async () => {
    const cards = [{ id: "d1" }, { id: "d2" }];
    await httpService.verifySetDetective(cards);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`${baseUrl}/sets/verify/?cards=d1&cards=d2`),
      expect.objectContaining({ method: "GET" })
    );
  });

  it("playDetectiveEffect should call request with POST and correct body (with secret)", async () => {
    const gameId = "g1";
    const cardIds = ["d1", "d2"];
    const playerId = "p1";
    const payload = { target_player: "p2", target_secret: "s1" };
    const expectedBody = {
      player_id: playerId,
      cards: cardIds,
      target_player_id: payload.target_player,
      secret_id: payload.target_secret
    };
    await httpService.playDetectiveEffect(gameId, cardIds, playerId, payload);
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/sets/play/${gameId}`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(expectedBody),
        headers: expect.objectContaining({ "Content-Type": "application/json" })
      })
    );
  });

  it("playDetectiveEffect should call request with POST and correct body (without secret)", async () => {
    const gameId = "g1";
    const cardIds = ["d3", "d4"];
    const playerId = "p1";
    const payload = { target_player: "p3" };
    const expectedBody = {
      player_id: playerId,
      cards: cardIds,
      target_player_id: payload.target_player
    };
    await httpService.playDetectiveEffect(gameId, cardIds, playerId, payload);
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/sets/play/${gameId}`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(expectedBody)
      })
    );
  });

  it("addDetectiveEffect should call request correctly (with and without secretId)", async () => {
    const payloadWithSecret = {
      target_player: "p2",
      target_secret: "s1",
      set_id: "set1"
    };
    const payloadWithoutSecret = {
      target_player: "p2",
      set_id: "set2"
    };

    const gameId = "g1";
    const cardId = "c1";
    const playerId = "p1";
    const expectedUrlWithSecret = `${baseUrl}/sets/${payloadWithSecret.set_id}/cards/${cardId}?game_id=${gameId}&player_id=${playerId}&target_player_id=${payloadWithSecret.target_player}&secret_id=${payloadWithSecret.target_secret}`;
    const expectedUrlWithoutSecret = `${baseUrl}/sets/${payloadWithoutSecret.set_id}/cards/${cardId}?game_id=${gameId}&player_id=${playerId}&target_player_id=${payloadWithoutSecret.target_player}`;

    await httpService.addDetectiveEffect(
      gameId,
      cardId,
      playerId,
      payloadWithSecret
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expectedUrlWithSecret,
      expect.objectContaining({
        method: "PUT"
      })
    );

    await httpService.addDetectiveEffect(
      gameId,
      cardId,
      playerId,
      payloadWithoutSecret
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expectedUrlWithoutSecret,
      expect.objectContaining({
        method: "PUT"
      })
    );
  });

  it("addAriadne should call request correctly", async () => {
    const gameId = "g1";
    const setId = "set1";
    const playerId = "p1";
    const cardId = "c1";

    const expectedUrl = `${baseUrl}/sets/ariadne/${setId}?game_id=${gameId}&player_id=${playerId}&card_id=${cardId}`;

    await httpService.addAriadne(gameId, setId, playerId, cardId);

    expect(mockFetch).toHaveBeenCalledWith(
      expectedUrl,
      expect.objectContaining({
        method: "PUT"
      })
    );
  });

  it("setsElectionSecret should call request with POST and correct body", async () => {
    const gameId = "g1";
    const payload = {
      setId: "set1",
      targetPlayerId: "p2",
      selectedSecretId: "s1"
    };

    const expectedBody = {
      set_id: payload.setId,
      player_id: payload.targetPlayerId,
      secret_id: payload.selectedSecretId
    };

    await httpService.setsElectionSecret(gameId, payload);

    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/sets/election_secret/${gameId}?`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(expectedBody),
        headers: expect.objectContaining({
          "Content-Type": "application/json"
        })
      })
    );
  });

  it("setsElectionSecret should include card_id in URL when provided", async () => {
    const gameId = "g1";
    const payload = {
      cardId: "c9",
      setId: "set1",
      targetPlayerId: "p2",
      selectedSecretId: "s1"
    };

    await httpService.setsElectionSecret(gameId, payload);

    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/sets/election_secret/${gameId}?card_id=c9`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          set_id: payload.setId,
          player_id: payload.targetPlayerId,
          secret_id: payload.selectedSecretId
        })
      })
    );
  });

  it("getSets should call request with correct query params (player only)", async () => {
    const gameId = "g1";
    const playerId = "p1";
    await httpService.getSets(gameId, playerId);
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/sets?game_id=${gameId}&player_id=${playerId}`,
      expect.objectContaining({ method: "GET" })
    );
  });

  it("getSets should call request with correct query params (player and set)", async () => {
    const gameId = "g1";
    const playerId = "p1";
    const setId = "set1";
    await httpService.getSets(gameId, playerId, setId);
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/sets?game_id=${gameId}&player_id=${playerId}&set_id=${setId}`,
      expect.objectContaining({ method: "GET" })
    );
  });
  
  it("revealSecretAction should call correct endpoint and body for P_Y_S and S_F_P", async () => {
    const payloadPYS = {
      gameId: "game-1",
      cardType: "P_Y_S",
      targetPlayerId: "p2",
      selectedSecretId: "s1"
    };

    const payloadSFP = {
      gameId: "game-2",
      cardType: "S_F_P",
      targetPlayerId: "p3",
      selectedSecretId: "s2"
    };

    const expectedBodyPYS = {
      player_id: "p2",
      secret_id: "s1"
    };

    const expectedBodySFP = {
      player_id: "p3",
      secret_id: "s2"
    };

    await httpService.revealSecretAction(payloadPYS);
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/secrets/reveal_for_pys/${payloadPYS.gameId}`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(expectedBodyPYS),
        headers: expect.objectContaining({
          "Content-Type": "application/json"
        })
      })
    );

    await httpService.revealSecretAction(payloadSFP);
    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/secrets/reveal_for_sfp/${payloadSFP.gameId}`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(expectedBodySFP),
        headers: expect.objectContaining({
          "Content-Type": "application/json"
        })
      })
    );
  });

  it("playCardNSF should call request with PUT and correct body", async () => {
    const payload = {
      gameId: "g777",
      playerId: "p123",
      eventId: "card999"
    };

    const expectedBody = {
      player_id: payload.playerId,
      card_id: payload.eventId
    };

    await httpService.playCardNSF(payload);

    expect(mockFetch).toHaveBeenCalledWith(
      `${baseUrl}/cards/play-no-so-fast/${payload.gameId}`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(expectedBody),
        headers: expect.objectContaining({
          "Content-Type": "application/json"
        })
      })
    );
  });
});
