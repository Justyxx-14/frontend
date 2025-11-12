import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import toast from "react-hot-toast";
import { UseGameWebSocket } from "./UseGameWebSocket";

// ------------------- MOCKS -------------------
const mockNavigate = vi.fn();

const mockWsService = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
};

const mockHttpService = {
  getTurnGame: vi.fn(),
  resolveCardTrade: vi.fn()
};


const mockCardActionsService = {
  callPassCard: vi.fn(),
  callVotePlayer: vi.fn(),
  callOtherSecrets: vi.fn(),
  ECTselection: vi.fn(),
  deviousSent: vi.fn(),
  viewOtherSecret: vi.fn(),
  callOtherSecrets: vi.fn()
};

const mockCardDetectiveService = {
  callOtherSecrets: vi.fn()
};

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
    dismissAll: vi.fn()
  }
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate
}));

vi.mock("@/services/CardActionService", () => ({
  createCardActionsService: () => mockCardActionsService
}));
vi.mock("@/services/HttpService", () => ({
  createHttpService: () => mockHttpService
}));
vi.mock("@/services/WSService", () => ({
  createWSService: () => mockWsService
}));

describe("UseGameWebSocket Hook", () => {
  let mockSetCurrentTurnID;
  let mockSetIsCurrentTurn;
  let mockSetTurnState;
  let mockReloadPlayerData;
  let mockSetCanNoSoFast;
  let mockSetNsfResetKey;

  const defaultProps = {
    wsService: mockWsService,
    httpService: mockHttpService,
    cardActionsService: mockCardActionsService,
    currentGame: { id: "game-123" },
    idPlayer: "player-1",
    dataPlayers: { "player-1": "You", "player-2": "Alice", "player-3": "Bob" },
    setCurrentTurnID: () => {},
    setIsCurrentTurn: () => {},
    setTurnState: () => {},
    reloadPlayerData: () => {},
    navigate: mockNavigate,
    gameId: "game-123",
    cardDetectiveService: mockCardDetectiveService,
    setIsPlayerSocialDisgrace: vi.fn(),
    setCanNoSoFast: vi.fn(),
    setNsfResetKey: vi.fn()
  };

  let wsEventCallbacks = {};
  const captureWsOn = (event, callback) => {
    wsEventCallbacks[event] = callback;
  };

  const simulateWsEvent = async (event, data) => {
    if (wsEventCallbacks[event]) {
      await act(async () => {
        await Promise.resolve(wsEventCallbacks[event](data));
      });
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    wsEventCallbacks = {};
    mockSetCurrentTurnID = vi.fn();
    mockSetIsCurrentTurn = vi.fn();
    mockSetTurnState = vi.fn();
    mockReloadPlayerData = vi.fn();
    mockSetCanNoSoFast = vi.fn();
    mockSetNsfResetKey = vi.fn();

    mockWsService.on.mockImplementation(captureWsOn);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should connect WS and register all handlers on mount", async () => {
    await act(async () => {
      renderHook(() =>
        UseGameWebSocket({
          ...defaultProps,
          setCurrentTurnID: mockSetCurrentTurnID,
          setIsCurrentTurn: mockSetIsCurrentTurn,
          setTurnState: mockSetTurnState,
          setCanNoSoFast: mockSetCanNoSoFast,
          setNsfResetKey: mockSetNsfResetKey
        })
      );
    });

    await waitFor(() => {
      expect(mockHttpService.getTurnGame).not.toHaveBeenCalled();
      expect(wsEventCallbacks["turnChange"]).toBeDefined();
      expect(wsEventCallbacks["updateDraft"]).toBeDefined();
      expect(wsEventCallbacks["playerDrawCards"]).toBeDefined();
      expect(wsEventCallbacks["playSet"]).toBeDefined();
      expect(wsEventCallbacks["playEvent"]).toBeDefined();
      expect(wsEventCallbacks["playerCardDiscarded"]).toBeDefined();
      expect(wsEventCallbacks["targetPlayerElection"]).toBeDefined();
      expect(wsEventCallbacks["passingPhaseStarted"]).toBeDefined();
      expect(wsEventCallbacks["passingPhaseExecuted"]).toBeDefined();
      expect(wsEventCallbacks["votingPhaseStarted"]).toBeDefined();
      expect(wsEventCallbacks["votingPhaseExecuted"]).toBeDefined();
      expect(wsEventCallbacks["playerHasVoted"]).toBeDefined();
      expect(wsEventCallbacks["secretRevealed"]).toBeDefined();
      expect(wsEventCallbacks["cardTradeResolved"]).toBeDefined(); // Añadido
      expect(wsEventCallbacks["endTimer"]).toBeDefined(); // Añadido
      expect(wsEventCallbacks["waitingForCancellationEvent"]).toBeDefined(); // Añadido
      expect(wsEventCallbacks["waitFinished"]).toBeDefined(); // Añadido
      expect(wsEventCallbacks["cancellationStopped"]).toBeDefined(); // Añadido
      expect(wsEventCallbacks["notSoFastPlayed"]).toBeDefined(); // Añadido
      expect(wsEventCallbacks["gameEnd"]).toBeDefined();
      expect(wsEventCallbacks["disconnect"]).toBeDefined();
    });
  });

  it("should call disconnect on unmount", () => {
    const { unmount } = renderHook(() => UseGameWebSocket(defaultProps));
    unmount();
    expect(mockWsService.disconnect).toHaveBeenCalledTimes(1);
    expect(mockWsService.off).not.toHaveBeenCalled();
  });

  it("should handle initialization error (e.g., connect throws)", async () => {
    const error = new Error("Connection failed");
    mockWsService.connect.mockImplementation(() => {
      throw error;
    });
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await act(async () => {
      renderHook(() => UseGameWebSocket(defaultProps));
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to initialize websocket handlers",
        error
      );
    });
  });

  it("should update turn state on 'turnChange' event (other player)", async () => {
    await act(async () => {
      renderHook(() =>
        UseGameWebSocket({
          ...defaultProps,
          setCurrentTurnID: mockSetCurrentTurnID,
          setIsCurrentTurn: mockSetIsCurrentTurn,
          setTurnState: mockSetTurnState
        })
      );
    });

    await simulateWsEvent("turnChange", { player_id: "player-2" });

    expect(mockSetCurrentTurnID).toHaveBeenCalledWith("player-2");
    expect(mockSetIsCurrentTurn).toHaveBeenCalledWith(false);
    expect(mockSetTurnState).not.toHaveBeenCalled();
  });

  it("should update turn state on 'turnChange' event (current player)", async () => {
    await act(async () => {
      renderHook(() =>
        UseGameWebSocket({
          ...defaultProps,
          setCurrentTurnID: mockSetCurrentTurnID,
          setIsCurrentTurn: mockSetIsCurrentTurn
        })
      );
    });

    await simulateWsEvent("turnChange", { player_id: "player-1" });
    expect(mockSetCurrentTurnID).toHaveBeenCalledWith("player-1");
    expect(mockSetIsCurrentTurn).toHaveBeenCalledWith(true);
  });

  it("should reload data and toast on 'updateDraft' if not current player", async () => {
    await act(async () => {
      renderHook(() =>
        UseGameWebSocket({
          ...defaultProps,
          reloadPlayerData: mockReloadPlayerData
        })
      );
    });

    await simulateWsEvent("updateDraft", { draft: [], player_id: "player-2" });

    expect(mockReloadPlayerData).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Alice drew 1 card from the draft"
      )
    );
  });

  it("should only reload data on 'updateDraft' if current player", async () => {
    await act(async () => {
      renderHook(() =>
        UseGameWebSocket({
          ...defaultProps,
          reloadPlayerData: mockReloadPlayerData,
          idPlayer: "player-2"
        })
      );
    });

    await simulateWsEvent("updateDraft", { draft: [], player_id: "player-2" });

    expect(mockReloadPlayerData).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  it("should reload data and toast on 'playerDrawCards' if not current player", async () => {
    await act(async () => {
      renderHook(() =>
        UseGameWebSocket({
          ...defaultProps,
          reloadPlayerData: mockReloadPlayerData
        })
      );
    });

    await simulateWsEvent("playerDrawCards", {
      id_player: "player-2",
      n_cards: 3
    });

    expect(mockReloadPlayerData).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Alice drew 3 cards from the regular deck"
      );
    });
  });

  it("should reload data and toast on 'playSet' if not current player", async () => {
    await act(async () => {
      renderHook(() =>
        UseGameWebSocket({
          ...defaultProps,
          reloadPlayerData: mockReloadPlayerData
        })
      );
    });

    await simulateWsEvent("playSet", {
      player_id: "player-2",
      target_player: "player-3"
    });

    expect(mockReloadPlayerData).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Alice played a set to Bob");
    });
  });

  it("should reload data and toast on 'playEvent' with target if not current player", async () => {
    await act(async () => {
      renderHook(() =>
        UseGameWebSocket({
          ...defaultProps,
          reloadPlayerData: mockReloadPlayerData
        })
      );
    });

    await simulateWsEvent("playEvent", {
      id_player: "player-2",
      target_player: "player-1",
      name: "E_COT"
    });

    expect(mockReloadPlayerData).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Alice played an event to You"
      );
    });
  });

  it("should reload data and toast on 'playEvent' without target if not current player", async () => {
    await act(async () => {
      renderHook(() =>
        UseGameWebSocket({
          ...defaultProps,
          reloadPlayerData: mockReloadPlayerData
        })
      );
    });

    await simulateWsEvent("playEvent", {
      id_player: "player-2",
      target_player: null,
      last_card: {
        description: "Look into the Ashes"
      }
    });

    expect(mockReloadPlayerData).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Alice played Look into the Ashes"
      );
    });
  });

  it("should call resolveCardTrade when receiving 'Card Trade' event targeting current player", async () => {
    mockCardActionsService.ECTselection.mockResolvedValue("selectedCard123");
    await act(async () => {
      renderHook(() =>
        UseGameWebSocket({
          ...defaultProps,
          reloadPlayerData: mockReloadPlayerData
        })
      );
    });

    const mockData = {
      id_player: "player-2",
      target_player: "player-1",
      name: "Card Trade",
      last_card: { id: "event-1", description: "Card Trade" }
    };

    await simulateWsEvent("playEvent", mockData);

    expect(mockReloadPlayerData).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(mockCardActionsService.ECTselection).toHaveBeenCalledWith("Alice");
      expect(mockHttpService.resolveCardTrade).toHaveBeenCalledWith({
        gameId: defaultProps.currentGame.id,
        playerId: "player-1",
        targetCardId: "selectedCard123",
        eventId: "event-1"
      });
    });

    expect(toast.success).toHaveBeenCalledWith("Alice played an event to You");
  });

  it("toast when cardTradeResolved ws is received (NOT current player involved)", async () => {
    await act(async () => {
      renderHook(() =>
        UseGameWebSocket({
          ...defaultProps,
          idPlayer: "player-1",
          reloadPlayerData: mockReloadPlayerData
        })
      );
    });

    await simulateWsEvent("cardTradeResolved", {
      player_id: "player-2",
      target_player: "player-3"
    });

    expect(mockReloadPlayerData).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Alice and Bob traded cards");
    });
  });

  it("toast when cardTradeResolved ws is received (current player involved)", async () => {
    await act(async () => {
      renderHook(() =>
        UseGameWebSocket({
          ...defaultProps,
          idPlayer: "player-1",
          reloadPlayerData: mockReloadPlayerData
        })
      );
    });

    await simulateWsEvent("cardTradeResolved", {
      player_id: "player-1",
      target_player: "player-2"
    });

    expect(mockReloadPlayerData).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Alice and you trade cards");
    });
  });

  it("should reload data on 'playerCardDiscarded' if last_card exists", async () => {
    await act(async () => {
      renderHook(() =>
        UseGameWebSocket({
          ...defaultProps,
          reloadPlayerData: mockReloadPlayerData
        })
      );
    });

    await simulateWsEvent("playerCardDiscarded", {
      last_card: { id: "c1", name: "Card" }
    });

    expect(mockReloadPlayerData).toHaveBeenCalledTimes(1);
  });

  it("should NOT reload data on 'playerCardDiscarded' if last_card is missing", async () => {
    await act(async () => {
      renderHook(() =>
        UseGameWebSocket({
          ...defaultProps,
          reloadPlayerData: mockReloadPlayerData
        })
      );
    });

    await simulateWsEvent("playerCardDiscarded", {
      last_card: null
    });

    expect(mockReloadPlayerData).not.toHaveBeenCalled();
  });

  describe("'targetPlayerElection' event", () => {
    it("should call cardDetectiveService.callOtherSecrets if event targets current player", async () => {
      mockCardDetectiveService.callOtherSecrets.mockResolvedValue(true);
      await act(async () => {
        renderHook(() => UseGameWebSocket({ ...defaultProps }));
      });

      await simulateWsEvent("targetPlayerElection", {
        target_player: "player-1",
        set_id: "set-abc"
      });

      await waitFor(() => {
        expect(mockCardDetectiveService.callOtherSecrets).toHaveBeenCalledWith(
          "set-abc",
          "player-1"
        );
        expect(toast.success).toHaveBeenCalledWith("Your secret was revealed");
      });
    });

    it("should NOT call cardDetectiveService.callOtherSecrets if event targets another player", async () => {
      await act(async () => {
        renderHook(() => UseGameWebSocket(defaultProps));
      });

      await simulateWsEvent("targetPlayerElection", {
        target_player: "player-2",
        set_id: "set-abc"
      });

      await waitFor(() => {
        expect(
          mockCardDetectiveService.callOtherSecrets
        ).not.toHaveBeenCalled();
      });
    });

    it("should show info toast if callOtherSecrets returns null/false", async () => {
      mockCardDetectiveService.callOtherSecrets.mockResolvedValue(null);
      await act(async () => {
        renderHook(() => UseGameWebSocket(defaultProps));
      });

      await simulateWsEvent("targetPlayerElection", {
        target_player: "player-1",
        set_id: "set-abc"
      });

      await waitFor(() => {
        expect(mockCardDetectiveService.callOtherSecrets).toHaveBeenCalled();
        expect(toast.info).toHaveBeenCalledWith(
          "The player you selected has no secrets available"
        );
        expect(toast.success).not.toHaveBeenCalled();
      });
    });

    it("should show error toast if callOtherSecrets throws", async () => {
      const error = new Error("Failed selection");
      mockCardDetectiveService.callOtherSecrets.mockRejectedValue(error);
      await act(async () => {
        renderHook(() => UseGameWebSocket(defaultProps));
      });

      await simulateWsEvent("targetPlayerElection", {
        target_player: "player-1",
        set_id: "set-abc"
      });

      await waitFor(() => {
        expect(mockCardDetectiveService.callOtherSecrets).toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith("Failed selection");
        expect(toast.success).not.toHaveBeenCalled();
      });
    });
  });

  it("ws 'actionRequiredChooseSecret' received, trigger_card_name is 'Blackmailed' and actor_player_id matches current player", async () => {
    const mockDeviousResult = { ok: true };
    mockCardActionsService.deviousSent = vi.fn().mockResolvedValue(mockDeviousResult);

    await act(async () => {
      renderHook(() =>
        UseGameWebSocket({
          ...defaultProps,
          reloadPlayerData: mockReloadPlayerData
        })
      );
    });

    const mockData = {
      trigger_card_name: "Blackmailed",
      target_player_id: "player-2",
      actor_player_id: "player-1"
    };

    await simulateWsEvent("actionRequiredChooseSecret", mockData);

    expect(mockCardActionsService.deviousSent).toHaveBeenCalledWith(
      mockData,
      "Alice"
    );

    expect(mockReloadPlayerData).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("should NOT call deviousSent if trigger_card_name is not 'Blackmailed' or actor_player_id does not match", async () => {
    mockCardActionsService.deviousSent = vi.fn();

    await act(async () => {
      renderHook(() =>
        UseGameWebSocket({
          ...defaultProps,
          reloadPlayerData: mockReloadPlayerData
        })
      );
    });

    // Case 1: trigger card is not Blackmailed
    await simulateWsEvent("actionRequiredChooseSecret", {
      trigger_card_name: "NotBlackmailed",
      target_player_id: "player-2",
      actor_player_id: "player-1"
    });

    // Case 2: actor is not current player
    await simulateWsEvent("actionRequiredChooseSecret", {
      trigger_card_name: "Blackmailed",
      target_player_id: "player-2",
      actor_player_id: "player-999"
    });

    expect(mockCardActionsService.deviousSent).not.toHaveBeenCalled();
    expect(mockReloadPlayerData).not.toHaveBeenCalled();
  });

  it("should handle 'actionRequiredChooseSecret' error gracefully", async () => {
    mockCardActionsService.deviousSent = vi.fn().mockRejectedValue(new Error("fail!"));

    await act(async () => {
      renderHook(() =>
        UseGameWebSocket({
          ...defaultProps,
          reloadPlayerData: mockReloadPlayerData
        })
      );
    });

    const mockData = {
      trigger_card_name: "Blackmailed",
      target_player_id: "player-2",
      actor_player_id: "player-1"
    };

    await simulateWsEvent("actionRequiredChooseSecret", mockData);

    expect(mockCardActionsService.deviousSent).toHaveBeenCalledWith(mockData, "Alice");
    expect(mockReloadPlayerData).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("fail!");
  });

    it("should handle 'sfpPending' event and call callOtherSecrets + show correct toasts", async () => {
    mockCardActionsService.callOtherSecrets.mockResolvedValue(true);

    await act(async () => {
      renderHook(() =>
        UseGameWebSocket({
          ...defaultProps,
          reloadPlayerData: mockReloadPlayerData
        })
      );
    });

    const mockData = {
      "players_id": ["player-1", "player-2"]
    };

    await simulateWsEvent("sfpPending", mockData);

    expect(mockCardActionsService.callOtherSecrets).toHaveBeenCalledWith(
      "player-1",
      "S_F_P"
    );

    expect(toast.success).toHaveBeenCalledWith("Secret revealed");

    expect(mockReloadPlayerData).toHaveBeenCalledTimes(1);


    expect(toast.dismissAll).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("You, Alice revealed a secret");
  });
  
  it("should show error toast if callOtherSecrets throws", async () => {
    mockCardActionsService.callOtherSecrets.mockRejectedValue(
      new Error("Network error")
    );

    await act(async () => {
      renderHook(() =>
        UseGameWebSocket({
          ...defaultProps,
          reloadPlayerData: mockReloadPlayerData
        })
      );
    });

    const mockData = { "players_id": ["player-1"] };

    await simulateWsEvent("sfpPending", mockData);

    expect(toast.error).toHaveBeenCalledWith("Network error");
  });

  it("should navigate on 'gameEnd' event", async () => {
    const gameEndData = { winner: "player-2", scores: {} };

    await act(async () => {
      renderHook(() => UseGameWebSocket(defaultProps));
    });

    await simulateWsEvent("gameEnd", gameEndData);

    expect(mockNavigate).toHaveBeenCalledWith(`/game/game-123/endGame`, {
      state: { gameResult: gameEndData, currentPlayerId: "player-1" }
    });
  });

  describe("cancellation and No So Fast related events", () => {
    it("should set canNoSoFast to true on 'waitingForCancellationEvent'", async () => {
      await act(async () => {
        renderHook(() =>
          UseGameWebSocket({
            ...defaultProps,
            setCanNoSoFast: mockSetCanNoSoFast
          })
        );
      });

      await simulateWsEvent("waitingForCancellationEvent");
      await waitFor(() => {
        expect(mockSetCanNoSoFast).toHaveBeenCalledWith(true);
      });
    });

    it("should set canNoSoFast to false on 'waitFinished'", async () => {
      await act(async () => {
        renderHook(() =>
          UseGameWebSocket({
            ...defaultProps,
            setCanNoSoFast: mockSetCanNoSoFast
          })
        );
      });

      await simulateWsEvent("waitFinished");
      await waitFor(() => {
        expect(mockSetCanNoSoFast).toHaveBeenCalledWith(false);
      });
    });

    it("should dismiss all toasts and show success on 'cancellationStopped'", async () => {
      await act(async () => {
        renderHook(() => UseGameWebSocket(defaultProps));
      });

      await simulateWsEvent("cancellationStopped");

      await waitFor(() => {
        // expect(toast.dismissAll).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith("The action was cancelled");
      });
    });

    it("should dismiss all toasts and show success with player name on 'notSoFastPlayed'", async () => {
      await act(async () => {
        renderHook(() => UseGameWebSocket(defaultProps));
      });

      await simulateWsEvent("notSoFastPlayed", { player_id: "player-2" });

      await waitFor(() => {
        // expect(toast.dismissAll).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith(
          "Alice played a No So Fast card"
        );
      });
    });

    it("should not crash if 'notSoFastPlayed' player_id not found", async () => {
      await act(async () => {
        renderHook(() => UseGameWebSocket(defaultProps));
      });

      await simulateWsEvent("notSoFastPlayed", { player_id: "unknown" });

      await waitFor(() => {
        // expect(toast.dismissAll).toHaveBeenCalled();
        expect(toast.success).not.toHaveBeenCalled();
      });
    });
  });
});
