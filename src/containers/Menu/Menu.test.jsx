import { render, screen, act, waitFor } from "@testing-library/react";
import { vi, describe, it, beforeEach, expect } from "vitest";
import Menu from "./Menu";
import MenuLayout from "./components/MenuLayout";

// --- Mock useGame ---
const mockJoinGameContext = vi.fn();
const mockCreateGameContext = vi.fn();
const mockUseGame = vi.fn(() => ({
  user: { id: "u1", name: "Camila", birthday: "2000-01-01" },
  joinGameContext: mockJoinGameContext,
  createGameContext: mockCreateGameContext,
}));

vi.mock("@/context/useGame", () => ({
  useGame: () => mockUseGame(),
}));

// --- Mock navigate ---
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// --- Mock WSService ---
const mockOn = vi.fn();
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();

vi.mock("@/services/WSService", () => ({
  createWSService: vi.fn(() => ({
    on: mockOn,
    connect: mockConnect,
    disconnect: mockDisconnect,
    isConnected: false,
  })),
}));

// --- Mock HttpService ---
const mockGetGames = vi.fn();
vi.mock("@/services/HttpService", () => ({
  createHttpService: vi.fn(() => ({
    getGames: mockGetGames,
  })),
}));

// --- Mock MenuLayout ---
vi.mock("./components/MenuLayout", () => ({
  default: vi.fn(() => <div>MenuLayout renderizado</div>),
}));

describe("Menu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetGames.mockResolvedValue([
      { id: "g1", name: "Juego 1", players_ids: ["p1"] },
    ]);
  });

  it("renderiza MenuLayout con las props correctas", async () => {
    await act(async () => render(<Menu />));

    // Verificar que MenuLayout se renderizó
    expect(MenuLayout).toHaveBeenCalled();

    // Props pasadas correctamente
    expect(MenuLayout.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        games: expect.any(Array),
        joinGame: expect.any(Function),
        createGame: expect.any(Function),
        formRef: expect.any(Object),
      })
    );
  });

  it("createGame llama a createGameContext y navega al lobby", async () => {
    mockCreateGameContext.mockResolvedValue({ id: "game-123" });
    await act(async () => render(<Menu />));

    const props = MenuLayout.mock.calls[0][0];

    await act(async () => {
      await props.createGame({ name: "Nueva partida" });
    });

    expect(mockCreateGameContext).toHaveBeenCalledWith(
      { name: "Nueva partida" },
      { id: "u1", name: "Camila", birthday: "2000-01-01" }
    );
    expect(mockNavigate).toHaveBeenCalledWith("/lobby/game-123");
  });

  it("joinGame llama a joinGameContext y navega al lobby", async () => {
    mockJoinGameContext.mockResolvedValue({ id: "joined-456" });
    await act(async () => render(<Menu />));

    const props = MenuLayout.mock.calls[0][0];

    await act(async () => {
      await props.joinGame({ id: "joined-456" });
    });

    expect(mockJoinGameContext).toHaveBeenCalledWith(
      { id: "joined-456" },
      { id: "u1", name: "Camila", birthday: "2000-01-01" }
    );
    expect(mockNavigate).toHaveBeenCalledWith("/lobby/joined-456");
  });

  it("desconecta el WS al desmontar", async () => {
    const { unmount } = render(<Menu />);
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("maneja eventos de WS: gameAdd, joinPlayerToGame, gameUnavailable", async () => {
    await act(async () => render(<Menu />));

    // obtener handlers de .on()
    const calls = mockOn.mock.calls;
    const addHandler = calls.find((c) => c[0] === "gameAdd")[1];
    const joinHandler = calls.find((c) => c[0] === "joinPlayerToGame")[1];
    const unavailableHandler = calls.find(
      (c) => c[0] === "gameUnavailable"
    )[1];

    // Emular "gameAdd"
    act(() => {
      addHandler({ id: "g2", name: "Nuevo juego", players_ids: [] });
    });
    const propsAfterAdd = MenuLayout.mock.calls.at(-1)[0];
    expect(propsAfterAdd.games.some((g) => g.id === "g2")).toBe(true);

    // Emular "joinPlayerToGame"
    act(() => {
      joinHandler({ id: "g1", players_ids: ["p1", "p2"] });
    });
    const propsAfterJoin = MenuLayout.mock.calls.at(-1)[0];
    expect(
      propsAfterJoin.games.find((g) => g.id === "g1").countPlayers
    ).toBe(2);

    // Emular "gameUnavailable"
    act(() => {
      unavailableHandler({ id: "g1" });
    });
    const propsAfterUnavailable = MenuLayout.mock.calls.at(-1)[0];
    expect(propsAfterUnavailable.games.some((g) => g.id === "g1")).toBe(false);
  });
});
