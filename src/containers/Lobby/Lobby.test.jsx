import { render, screen, waitFor, act } from "@testing-library/react";
import { vi, describe, it, beforeEach, expect } from "vitest";
import Lobby from "./Lobby";
import LobbyLayout from "./components/LobbyLayout";

// mock useGame
const mockStartGameContext = vi.fn();
const mockSetDataPlayers = vi.fn();
const mockUseGame = vi.fn(() => ({
  currentGame: { id: "game-123", name: "Partida test" },
  dataPlayers: { p1: "Camila" },
  setDataPlayers: mockSetDataPlayers,
  startGameContext: mockStartGameContext,
  idPlayer: "owner-1",
}));

vi.mock("@/context/useGame", () => ({
  useGame: () => mockUseGame(),
}));

// mock navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// mock WSService
const mockOn = vi.fn();
const mockOff = vi.fn();
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();

vi.mock("@/services/WSService", () => ({
  createWSService: vi.fn(() => ({
    on: mockOn,
    off: mockOff,
    connect: mockConnect,
    disconnect: mockDisconnect,
    isConnected: false,
  })),
}));

//mock LobbyLayout
vi.mock("./components/LobbyLayout", () => ({
  default: vi.fn(() => <div>LobbyLayout renderizado</div>),
}));

describe("Lobby", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza LobbyLayout con las props correctas", () => {
    render(<Lobby />);
    expect(LobbyLayout.mock.calls[0][0]).toEqual(
        expect.objectContaining({
            currentGame: { id: "game-123", name: "Partida test" },
            dataPlayers: { p1: "Camila" },
            idPlayer: "owner-1",
            startGame: expect.any(Function),
        })
    );
  });

  it("startGame llama a startGameContext con el id del juego", async () => {
    render(<Lobby />);
    // accedemos a la función pasada como prop
    const props = LobbyLayout.mock.calls[0][0];
    await act(async () => {
      await props.startGame();
    });
    expect(mockStartGameContext).toHaveBeenCalledWith("game-123");
  });

  it("navega al juego cuando se emite 'GameStarted'", async () => {
    render(<Lobby />);

    const onCalls = mockOn.mock.calls;
    const gameUnavailableHandler = onCalls.find(
      (c) => c[0] === "GameStarted"
    )[1];

    act(() => {
      gameUnavailableHandler({ id: "game-123" });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/game/game-123");
  });

  it("desconecta y remueve handlers al desmontar", () => {
    const { unmount } = render(<Lobby />);
    unmount();
    expect(mockOff).toHaveBeenCalledTimes(3);
    expect(mockDisconnect).toHaveBeenCalled();
  });
});