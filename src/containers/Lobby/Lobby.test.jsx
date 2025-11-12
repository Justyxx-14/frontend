import {
  render,
  screen,
  fireEvent,
  act,
  waitFor
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useGame } from "@/context/useGame";
import { createWSService } from "@/services/WSService";
import { createHttpService } from "@/services/HttpService";
import Lobby from "./Lobby";

const mockNavigate = vi.fn();
const mockSetDataPlayers = vi.fn();
const mockStartGameContext = vi.fn();

vi.mock("react-router-dom", () => ({
  useParams: () => ({ gameId: "lobby-game-123" }),
  useNavigate: () => mockNavigate
}));

vi.mock("@/context/useGame");

const mockWsService = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
};
vi.mock("@/services/WSService", () => ({
  createWSService: () => mockWsService
}));

const mockHttpService = {
  leaveGame: vi.fn()
};
vi.mock("@/services/HttpService", () => ({
  createHttpService: () => mockHttpService
}));


vi.mock("./components/LobbyLayout", () => ({
  default: vi.fn(({ startGame, leaveGame }) => (
    <div>
      <div data-testid="lobby-layout">Lobby Layout</div>
      <button onClick={startGame}>Start Game</button>
      <button onClick={leaveGame}>Leave Game</button>
    </div>
  ))
}));

describe("Lobby Component", () => {
  const mockCurrentGame = { id: "lobby-game-123", host_id: "player-1" };
  const mockDataPlayers = { "player-1": "Alice" };
  const mockIdPlayer = "player-1";

  let wsEventCallbacks = {};
  const captureWsOn = (event, callback) => {
    wsEventCallbacks[event] = callback;
  };

  const simulateWsEvent = async (event, data) => {
    if (wsEventCallbacks[event]) {
      await act(async () => {
        await Promise.resolve(wsEventCallbacks[event](data));
      });
    } else {
      console.warn(`No WS handler registered for event: ${event}`);
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    wsEventCallbacks = {};
    mockWsService.on.mockImplementation(captureWsOn);
    mockHttpService.leaveGame.mockResolvedValue({});

    vi.mocked(useGame).mockReturnValue({
      currentGame: mockCurrentGame,
      dataPlayers: mockDataPlayers,
      setDataPlayers: mockSetDataPlayers,
      startGameContext: mockStartGameContext,
      idPlayer: mockIdPlayer
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders LobbyLayout with initial props", () => {
    render(<Lobby />);
    expect(screen.getByTestId("lobby-layout")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Start Game/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Leave Game/i })).toBeInTheDocument();
  });

  it("calls startGameContext when start button is clicked", async () => {
    mockStartGameContext.mockResolvedValue(); // Simulate successful start
    render(<Lobby />);

    const startButton = screen.getByRole("button", { name: /Start Game/i });
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockStartGameContext).toHaveBeenCalledWith("lobby-game-123");
    });
  });

  it("handles error if startGameContext fails", async () => {
    const error = new Error("Failed to start");
    mockStartGameContext.mockRejectedValue(error);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    render(<Lobby />);

    const startButton = screen.getByRole("button", { name: /Start Game/i });
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockStartGameContext).toHaveBeenCalledWith("lobby-game-123");
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error starting the game: ",
      error
    );
  });

  describe("WebSocket Effects", () => {
    it("connects to WS and registers handlers on mount", async () => {
      render(<Lobby />);
      await act(async () => {
        await new Promise(res => setTimeout(res, 550));
      });
      expect(mockWsService.connect).toHaveBeenCalledWith("lobby-game-123");
      await waitFor(() => {
        expect(wsEventCallbacks["playerJoined"]).toBeDefined();
        expect(wsEventCallbacks["leavePlayerFromGame"]).toBeDefined();
        expect(wsEventCallbacks["GameStarted"]).toBeDefined();
        expect(wsEventCallbacks["playerLeft"]).toBeDefined();
        expect(wsEventCallbacks["GameCancelled"]).toBeDefined();
        expect(wsEventCallbacks["disconnect"]).toBeDefined();
      });
    });

    it("calls setDataPlayers on 'playerJoined' event for the current game", async () => {
      render(<Lobby />);
      await waitFor(() =>
        expect(wsEventCallbacks["playerJoined"]).toBeDefined()
      );

      const joinData = {
        game_id: "lobby-game-123",
        player_id: "player-2",
        player_name: "Bob"
      };
      await simulateWsEvent("playerJoined", joinData);

      expect(mockSetDataPlayers).toHaveBeenCalledTimes(1);
      const updaterFn = mockSetDataPlayers.mock.calls[0][0];
      const previousState = { "player-1": "Alice" };
      expect(updaterFn(previousState)).toEqual({
        "player-1": "Alice",
        "player-2": "Bob"
      });
    });

    it("does NOT call setDataPlayers on 'playerJoined' event for a different game", async () => {
      render(<Lobby />);
      await waitFor(() =>
        expect(wsEventCallbacks["playerJoined"]).toBeDefined()
      );

      const joinData = {
        game_id: "other-game",
        player_id: "player-2",
        player_name: "Bob"
      };
      await simulateWsEvent("playerJoined", joinData);

      expect(mockSetDataPlayers).not.toHaveBeenCalled();
    });
    it("calls setDataPlayers on 'leavePlayerFromGame' event (current implementation adds)", async () => {
      render(<Lobby />);
      await waitFor(() =>
        expect(wsEventCallbacks["leavePlayerFromGame"]).toBeDefined()
      );

      const leaveData = {
        id: "lobby-game-123",
        player_id: "player-2",
        player_name: "Bob"
      };
      await simulateWsEvent("leavePlayerFromGame", leaveData);

      expect(mockSetDataPlayers).toHaveBeenCalledTimes(1);
      const updaterFn = mockSetDataPlayers.mock.calls[0][0];
      const previousState = { "player-1": "Alice", "player-2": "Bob" };
      expect(updaterFn(previousState)).toEqual({
        "player-1": "Alice",
        "player-2": "Bob"
      });
    });

    it("navigates on 'GameStarted' event for the current game", async () => {
      render(<Lobby />);
      await waitFor(() =>
        expect(wsEventCallbacks["GameStarted"]).toBeDefined()
      );

      const startData = { id: "lobby-game-123" };
      await simulateWsEvent("GameStarted", startData);

      expect(mockNavigate).toHaveBeenCalledWith("/game/lobby-game-123");
    });

    it("does NOT navigate on 'GameStarted' event for a different game", async () => {
      render(<Lobby />);
      await waitFor(() =>
        expect(wsEventCallbacks["GameStarted"]).toBeDefined()
      );

      const startData = { id: "other-game-456" };
      await simulateWsEvent("GameStarted", startData);

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("logs warning on 'disconnect' event", async () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      render(<Lobby />);
      await waitFor(() => expect(wsEventCallbacks["disconnect"]).toBeDefined());

      await simulateWsEvent("disconnect", {});

      expect(consoleWarnSpy).toHaveBeenCalledWith("WebSocket disconnected");
    });

    it("calls wsService.off and disconnect on unmount", async () => {
      const { unmount } = render(<Lobby />);
      await waitFor(() =>
        expect(wsEventCallbacks["playerJoined"]).toBeDefined()
      );

      unmount();

      expect(mockWsService.off).toHaveBeenCalledWith(
        "playerJoined",
        expect.any(Function)
      );
      expect(mockWsService.off).toHaveBeenCalledWith(
        "leavePlayerFromGame",
        expect.any(Function)
      );
      expect(mockWsService.off).toHaveBeenCalledWith(
        "GameStarted",
        expect.any(Function)
      );
      expect(mockWsService.off).toHaveBeenCalledWith(
        "playerLeft",
        expect.any(Function)
      );
      expect(mockWsService.off).toHaveBeenCalledWith(
        "GameCancelled",
        expect.any(Function)
      );
      expect(mockWsService.disconnect).toHaveBeenCalledTimes(1);
    });
  });

  // =============================================
  // NUEVOS TESTS PARA LA FUNCIONALIDAD DE LEAVE GAME
  // =============================================
  describe("Leave Game Functionality", () => {
    it("calls httpService.leaveGame when leave button is clicked", async () => {
      render(<Lobby />);

      const leaveButton = screen.getByRole("button", { name: /Leave Game/i });
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(mockHttpService.leaveGame).toHaveBeenCalledWith(
          "lobby-game-123",
          "player-1"
        );
      });
    });

    it("navigates to home on leaveGame error", async () => {
      const error = new Error("Failed to leave");
      mockHttpService.leaveGame.mockRejectedValue(error);
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      render(<Lobby />);

      const leaveButton = screen.getByRole("button", { name: /Leave Game/i });
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(mockHttpService.leaveGame).toHaveBeenCalledWith(
          "lobby-game-123",
          "player-1"
        );
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error leaving the game: ",
        error
      );
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("registers new WebSocket handlers for leave events", async () => {
      render(<Lobby />);
      await waitFor(() => {
        expect(wsEventCallbacks["playerLeft"]).toBeDefined();
        expect(wsEventCallbacks["GameCancelled"]).toBeDefined();
      });
    });

    describe("playerLeft WebSocket Event", () => {
      it("navigates to home when current player leaves", async () => {
        render(<Lobby />);
        await waitFor(() => expect(wsEventCallbacks["playerLeft"]).toBeDefined());

        const leaveData = {
          game_id: "lobby-game-123",
          player_id: "player-1"
        };
        await simulateWsEvent("playerLeft", leaveData);

        expect(mockNavigate).toHaveBeenCalledWith("/");
      });

      it("removes player from dataPlayers when other player leaves", async () => {
        render(<Lobby />);
        await waitFor(() => expect(wsEventCallbacks["playerLeft"]).toBeDefined());

        const leaveData = {
          game_id: "lobby-game-123",
          player_id: "player-2"
        };
        await simulateWsEvent("playerLeft", leaveData);

        expect(mockSetDataPlayers).toHaveBeenCalledTimes(1);
        const updaterFn = mockSetDataPlayers.mock.calls[0][0];
        const previousState = { "player-1": "Alice", "player-2": "Bob" };
        expect(updaterFn(previousState)).toEqual({
          "player-1": "Alice"
        });
      });

      it("does nothing when playerLeft event is for different game", async () => {
        render(<Lobby />);
        await waitFor(() => expect(wsEventCallbacks["playerLeft"]).toBeDefined());

        const leaveData = {
          game_id: "other-game",
          player_id: "player-1"
        };
        await simulateWsEvent("playerLeft", leaveData);

        expect(mockNavigate).not.toHaveBeenCalled();
        expect(mockSetDataPlayers).not.toHaveBeenCalled();
      });
    });

    describe("GameCancelled WebSocket Event", () => {
      it("navigates to home when game is cancelled", async () => {
        render(<Lobby />);
        await waitFor(() => expect(wsEventCallbacks["GameCancelled"]).toBeDefined());

        const cancelData = {
          game_id: "lobby-game-123"
        };
        await simulateWsEvent("GameCancelled", cancelData);

        expect(mockNavigate).toHaveBeenCalledWith("/");
      });

      it("does nothing when GameCancelled event is for different game", async () => {
        render(<Lobby />);
        await waitFor(() => expect(wsEventCallbacks["GameCancelled"]).toBeDefined());

        const cancelData = {
          game_id: "other-game"
        };
        await simulateWsEvent("GameCancelled", cancelData);

        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it("cleans up new WebSocket handlers on unmount", async () => {
      const { unmount } = render(<Lobby />);
      await waitFor(() => {
        expect(wsEventCallbacks["playerLeft"]).toBeDefined();
        expect(wsEventCallbacks["GameCancelled"]).toBeDefined();
      });

      unmount();

      expect(mockWsService.off).toHaveBeenCalledWith(
        "playerLeft",
        expect.any(Function)
      );
      expect(mockWsService.off).toHaveBeenCalledWith(
        "GameCancelled",
        expect.any(Function)
      );
    });
  });
});