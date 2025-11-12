import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import toast from "react-hot-toast";
import { UseTurnPhase } from "./UseTurnPhase";

vi.mock("react-hot-toast", () => ({
  default: {
    loading: vi.fn(),
    dismiss: vi.fn(),
    success: vi.fn(),
    error: vi.fn()
  }
}));

const mockGetTurnGame = vi.fn();
const mockGetPlayerById = vi.fn();
const mockHttpService = {
  getTurnGame: mockGetTurnGame,
  getPlayerById: mockGetPlayerById
};

describe("UseTurnPhase Hook", () => {
  let mockSetCurrentTurnID;
  let mockSetIsCurrentTurn;

  const defaultProps = {
    currentGame: { id: "game-123" },
    httpService: mockHttpService,
    idPlayer: "player-1",
    inventoryCards: [],
    inventoryDraftCards: [],
    inventorySecrets: [],
    setCurrentTurnID: () => {},
    setIsCurrentTurn: () => {},
    currentTurnID: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetCurrentTurnID = vi.fn();
    mockSetIsCurrentTurn = vi.fn();

    mockGetTurnGame.mockResolvedValue({
      current_turn: "player-1",
      turn_state: "IDLE",
      target_player_id: null
    });

    mockGetPlayerById.mockResolvedValue({ name: "Alice" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with null state before fetch", () => {
    const { result } = renderHook(() => UseTurnPhase(defaultProps));
    expect(result.current.turnState).toBeNull();
    expect(result.current.turnInfo).toBeNull();
  });

  it("should fetch turn info and update states on mount", async () => {
    const turnInfo = {
      current_turn: "player-1",
      turn_state: "IDLE",
      target_player_id: null
    };
    mockGetTurnGame.mockResolvedValue(turnInfo);

    const { result } = renderHook(() =>
      UseTurnPhase({
        ...defaultProps,
        setCurrentTurnID: mockSetCurrentTurnID,
        setIsCurrentTurn: mockSetIsCurrentTurn
      })
    );

    await waitFor(() => {
      expect(result.current.turnState).toBe("IDLE");
    });

    expect(mockGetTurnGame).toHaveBeenCalledWith("game-123");
    expect(mockSetCurrentTurnID).toHaveBeenCalledWith("player-1");
    expect(mockSetIsCurrentTurn).toHaveBeenCalledWith(true);
    expect(result.current.turnInfo).toEqual(turnInfo);
    expect(toast.loading).not.toHaveBeenCalled();
  });

  it("should show 'waiting' toast if state is CHOOSING_SECRET and target is other player", async () => {
    const turnInfo = {
      current_turn: "player-1",
      turn_state: "CHOOSING_SECRET",
      target_player_id: "player-2"
    };
    mockGetTurnGame.mockResolvedValue(turnInfo);
    vi.mocked(toast.loading).mockReturnValue("toast-123");

    const { result } = renderHook(() => UseTurnPhase(defaultProps));

    await waitFor(() => {
      expect(result.current.turnState).toBe("CHOOSING_SECRET");
    });

    await waitFor(() => {
      expect(mockGetPlayerById).toHaveBeenCalledWith("player-2");
    });

    expect(toast.loading).toHaveBeenCalledWith(
      "Waiting for Alice to choose a secret...",
      { duration: Infinity }
    );
    expect(toast.dismiss).not.toHaveBeenCalled();
  });

  it("should show generic 'waiting' toast if getPlayerById fails", async () => {
    const turnInfo = {
      current_turn: "player-1",
      turn_state: "CHOOSING_SECRET",
      target_player_id: "player-2"
    };
    mockGetTurnGame.mockResolvedValue(turnInfo);
    mockGetPlayerById.mockRejectedValue(new Error("Player not found"));
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { result } = renderHook(() => UseTurnPhase(defaultProps));

    await waitFor(() => {
      expect(result.current.turnState).toBe("CHOOSING_SECRET");
    });

    await waitFor(() => {
      expect(mockGetPlayerById).toHaveBeenCalledWith("player-2");
    });

    expect(toast.loading).toHaveBeenCalledWith(
      "Waiting for another player to choose a secret...",
      { duration: Infinity }
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Could not get player name for toast:",
      expect.any(Error)
    );
  });

  it("should NOT show 'waiting' toast if state is CHOOSING_SECRET and target is self", async () => {
    const turnInfo = {
      current_turn: "player-1",
      turn_state: "CHOOSING_SECRET",
      target_player_id: "player-1"
    };
    mockGetTurnGame.mockResolvedValue(turnInfo);

    const { result } = renderHook(() => UseTurnPhase(defaultProps));

    await waitFor(() => {
      expect(result.current.turnState).toBe("CHOOSING_SECRET");
    });

    expect(mockGetPlayerById).not.toHaveBeenCalled();
    expect(toast.loading).not.toHaveBeenCalled();
  });

  it("should dismiss 'waiting' toast when state changes from waiting to idle", async () => {
    const waitingState = {
      current_turn: "player-1",
      turn_state: "CHOOSING_SECRET",
      target_player_id: "player-2"
    };
    const idleState = {
      current_turn: "player-2",
      turn_state: "IDLE",
      target_player_id: null
    };
    const mockToastId = "toast-xyz";
    vi.mocked(toast.loading).mockReturnValue(mockToastId);

    mockGetTurnGame.mockResolvedValue(waitingState);
    const { rerender, result } = renderHook(props => UseTurnPhase(props), {
      initialProps: defaultProps
    });

    await waitFor(() => {
      expect(toast.loading).toHaveBeenCalledTimes(1);
    });

    mockGetTurnGame.mockResolvedValue(idleState);
    rerender({ ...defaultProps, currentTurnID: "player-2" });

    await waitFor(() => {
      expect(result.current.turnState).toBe("IDLE");
    });

    expect(toast.dismiss).toHaveBeenCalledWith(mockToastId);
  });

  it("should dismiss 'waiting' toast on unmount", async () => {
    const turnInfo = {
      current_turn: "player-1",
      turn_state: "CHOOSING_SECRET",
      target_player_id: "player-2"
    };
    mockGetTurnGame.mockResolvedValue(turnInfo);
    const mockToastId = "toast-123";
    vi.mocked(toast.loading).mockReturnValue(mockToastId);

    const { unmount } = renderHook(() => UseTurnPhase(defaultProps));

    await waitFor(() => {
      expect(toast.loading).toHaveBeenCalledTimes(1);
    });

    unmount();

    expect(toast.dismiss).toHaveBeenCalledWith(mockToastId);
  });

  it("should handle error during getTurnGame fetch", async () => {
    const error = new Error("API Down");
    mockGetTurnGame.mockRejectedValue(error);
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { result } = renderHook(() => UseTurnPhase(defaultProps));

    await waitFor(() => {
      expect(mockGetTurnGame).toHaveBeenCalled();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching turn info in UseTurnPhase:",
      error
    );
    expect(result.current.turnState).toBeNull();
    expect(toast.loading).not.toHaveBeenCalled();
  });

  it("should provide a functional setTurnState", async () => {
    const { result } = renderHook(() => UseTurnPhase(defaultProps));

    await waitFor(() => {
      expect(result.current.turnState).toBe("IDLE");
    });

    act(() => {
      result.current.setTurnState("DISCARDING");
    });

    expect(result.current.turnState).toBe("DISCARDING");

    expect(result.current.turnInfo.turn_state).toBe("DISCARDING");
    expect(result.current.turnInfo.current_turn).toBe("player-1");
  });
});
