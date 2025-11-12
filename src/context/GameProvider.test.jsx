import { render, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GameProvider } from "./GameProvider";
import { useGame } from "./useGame";

const {
  mockCreateGame,
  mockJoinGame,
  mockGetGameInfo,
  mockGetPlayers,
  mockDiscardCards,
  mockStartGame,
  mockGetCardsByPlayer
} = vi.hoisted(() => {
  //
  return {
    mockCreateGame: vi.fn(),
    mockJoinGame: vi.fn(),
    mockGetGameInfo: vi.fn(),
    mockGetPlayers: vi.fn(),
    mockDiscardCards: vi.fn(),
    mockStartGame: vi.fn(),
    mockGetCardsByPlayer: vi.fn()
  };
});

vi.mock("@/services/HttpService", () => ({
  createHttpService: () => ({
    createGame: mockCreateGame,
    joinGame: mockJoinGame,
    getGameInfo: mockGetGameInfo,
    getPlayers: mockGetPlayers,
    discardCards: mockDiscardCards,
    startGame: mockStartGame,
    getCardsByPlayer: mockGetCardsByPlayer
  })
}));

let capturedContextValues;

// Define Consumer at the top level
const TestConsumer = () => {
  capturedContextValues = useGame();
  return null;
};

const renderWithProvider = () => {
  const { rerender } = render(
    <GameProvider>
      <TestConsumer />
    </GameProvider>
  );
  return {
    getContextValues: () => capturedContextValues,
    rerenderProvider: () =>
      rerender(
        <GameProvider>
          <TestConsumer />
        </GameProvider>
      )
  };
};

describe("GameProvider", () => {
  let getContextValues;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    capturedContextValues = undefined;
    const renderResult = renderWithProvider();
    getContextValues = renderResult.getContextValues;
  });

  it("createGameContext sets currentGame, dataPlayers, idPlayer", async () => {
    const fakeGame = { host_id: "player1", id: "game1" };
    const fakeUser = { name: "Alice" };
    mockCreateGame.mockResolvedValue(fakeGame);

    expect(getContextValues()).toBeDefined();
    expect(getContextValues().currentGame).toBeNull();

    let result;
    await act(async () => {
      result = await getContextValues().createGameContext(fakeGame, fakeUser);
    });

    expect(mockCreateGame).toHaveBeenCalledWith(fakeGame, fakeUser);
    expect(getContextValues().currentGame).toEqual(fakeGame);
    expect(getContextValues().dataPlayers).toEqual({ player1: "Alice" });
    expect(getContextValues().idPlayer).toBe("player1");
    expect(result).toEqual(fakeGame);
  });

  it("joinGameContext sets currentGame, dataPlayers, idPlayer", async () => {
    const fakeGameData = { id: "game1", players_ids: ["player1", "player2"] };
    const fakeUserData = { name: "Bob" };
    const fakeJoinResponse = { player_id: "player2" };
    const fakePlayersDataMap = { player1: "Alice", player2: "Bob" };
    mockGetPlayers.mockImplementation(async playerId => {
      if (playerId === "player1") return { name: "Alice" };
      if (playerId === "player2") return { name: "Bob" };
      return { name: "Unknown" };
    });

    mockJoinGame.mockResolvedValue(fakeJoinResponse);
    mockGetGameInfo.mockResolvedValue(fakeGameData);

    expect(getContextValues()).toBeDefined();

    let result;
    await act(async () => {
      result = await getContextValues().joinGameContext(
        fakeGameData,
        fakeUserData
      );
    });

    expect(mockJoinGame).toHaveBeenCalledWith(fakeGameData.id, fakeUserData, null);
    expect(mockGetGameInfo).toHaveBeenCalledWith(fakeGameData.id);
    expect(mockGetPlayers).toHaveBeenCalledWith("player1");
    expect(mockGetPlayers).toHaveBeenCalledWith("player2");
    expect(getContextValues().currentGame).toEqual(fakeGameData);
    expect(getContextValues().dataPlayers).toEqual(fakePlayersDataMap);
    expect(getContextValues().idPlayer).toBe(fakeJoinResponse.player_id);
    expect(result).toEqual(fakeGameData);
  });

  it("startGameContext updates currentGame", async () => {
    const fakeGame = { id: "game1", state: "STARTED" };
    mockStartGame.mockResolvedValue();
    mockGetGameInfo.mockResolvedValue(fakeGame);

    expect(getContextValues()).toBeDefined();

    await act(async () => {
      await getContextValues().startGameContext("game1");
    });

    expect(mockStartGame).toHaveBeenCalledWith("game1");
    expect(mockGetGameInfo).toHaveBeenCalledWith("game1");
    expect(getContextValues().currentGame).toEqual(fakeGame);
  });

  it("discardCardsContext calls httpService.discardCards", async () => {
    const response = { success: true };
    mockDiscardCards.mockResolvedValue(response);

    expect(getContextValues()).toBeDefined();

    let result;
    await act(async () => {
      result = await getContextValues().discardCardsContext(
        "game1",
        "player1",
        ["c1"]
      );
    });

    expect(mockDiscardCards).toHaveBeenCalledWith("game1", "player1", ["c1"]);
    expect(result).toEqual(response);
  });

  it("cardsByPlayerContext calls httpService.getCardsByPlayer", async () => {
    const cards = [{ id: "c1", name: "Card1" }];
    mockGetCardsByPlayer.mockResolvedValue(cards);

    expect(getContextValues()).toBeDefined();

    let result;
    await act(async () => {
      result = await getContextValues().cardsByPlayerContext(
        "game1",
        "player1"
      );
    });

    expect(mockGetCardsByPlayer).toHaveBeenCalledWith("game1", "player1");
    expect(result).toEqual(cards);
  });

  it("resets dataPlayers when currentGame changes via context action", async () => {
    const game1 = { host_id: "player1", id: "game1" };
    const user1 = { name: "Alice" };
    const game2 = { host_id: "player2", id: "game2" };
    const user2 = { name: "Bob" };

    mockCreateGame.mockResolvedValueOnce(game1).mockResolvedValueOnce(game2);

    expect(getContextValues()).toBeDefined();

    await act(async () => {
      await getContextValues().createGameContext(game1, user1);
    });

    expect(getContextValues().currentGame).toEqual(game1);
    expect(getContextValues().dataPlayers).toEqual({ player1: "Alice" });

    await act(async () => {
      await getContextValues().createGameContext(game2, user2);
    });

    expect(getContextValues().currentGame).toEqual(game2);
    expect(getContextValues().dataPlayers).toEqual({ player2: "Bob" });
  });

  describe("Error Handling", () => {
    it("handles createGameContext error", async () => {
      const error = new Error("Failed to create");
      mockCreateGame.mockRejectedValue(error);
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await expect(
        getContextValues().createGameContext({}, {})
      ).rejects.toThrow("Failed to create");

      expect(getContextValues().currentGame).toBeNull();
      expect(getContextValues().dataPlayers).toEqual({});
      expect(getContextValues().idPlayer).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to create game:",
        error
      );
      consoleErrorSpy.mockRestore();
    });

    it("handles joinGameContext error", async () => {
      const error = new Error("Failed to join");
      mockJoinGame.mockRejectedValue(error);
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await expect(
        getContextValues().joinGameContext({ id: "game1" }, {})
      ).rejects.toThrow("Failed to join");

      expect(getContextValues().currentGame).toBeNull();
      expect(getContextValues().dataPlayers).toEqual({});
      expect(getContextValues().idPlayer).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to join game:",
        error
      );
      consoleErrorSpy.mockRestore();
    });

    it("handles startGameContext error", async () => {
      const error = new Error("Failed to start");
      mockStartGame.mockRejectedValue(error);
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await act(async () => {
        getContextValues().setCurrentGame({ id: "game1", state: "LOBBY" });
      });

      await expect(
        getContextValues().startGameContext("game1")
      ).rejects.toThrow("Failed to start");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to start game:",
        error
      );
      consoleErrorSpy.mockRestore();
    });

    it("handles discardCardsContext error", async () => {
      const error = new Error("Failed to discard");
      mockDiscardCards.mockRejectedValue(error);
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await expect(
        getContextValues().discardCardsContext("g1", "p1", ["c1"])
      ).rejects.toThrow("Failed to discard");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to discard card(s):",
        error
      );
      consoleErrorSpy.mockRestore();
    });

    it("handles cardsByPlayerContext error", async () => {
      const error = new Error("Failed to get cards");
      mockGetCardsByPlayer.mockRejectedValue(error);
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await expect(
        getContextValues().cardsByPlayerContext("g1", "p1")
      ).rejects.toThrow("Failed to get cards");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to get cards by player:",
        error
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe("Session Storage Persistence", () => {
    it("clears sessionStorage item when context state becomes null/empty", async () => {
      const game1 = { id: "game1" };
      const user1 = { name: "Alice" };

      await act(async () => {
        getContextValues().setUser(user1);
        getContextValues().setCurrentGame(game1);
        getContextValues().setDataPlayers({ p1: "Alice" });
        sessionStorage.setItem("idPlayer", "player1");
      });

      expect(sessionStorage.getItem("user")).toBeDefined();
      expect(sessionStorage.getItem("currentGame")).toBeDefined();
      expect(sessionStorage.getItem("dataPlayers")).toBeDefined();
      expect(sessionStorage.getItem("idPlayer")).toBeDefined();

      await act(async () => {
        getContextValues().setUser(null);
        getContextValues().setCurrentGame(null);
        getContextValues().setDataPlayers({});
      });

      await waitFor(() => {
        expect(sessionStorage.getItem("user")).toBeNull();
        expect(sessionStorage.getItem("currentGame")).toBeNull();
        expect(sessionStorage.getItem("dataPlayers")).toBeNull();
      });
    });
  });
});
