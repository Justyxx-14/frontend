import { render, screen, act, waitFor } from "@testing-library/react";
import { vi, describe, it, beforeEach, expect, afterEach } from "vitest";
import Menu from "./Menu";
import MenuLayout from "./components/MenuLayout";

const mockJoinGameContext = vi.fn();
const mockCreateGameContext = vi.fn();
const mockUseGame = vi.fn(() => ({
  user: { id: "u1", name: "Camila", birthday: "2000-01-01" },
  joinGameContext: mockJoinGameContext,
  createGameContext: mockCreateGameContext
}));

vi.mock("@/context/useGame", () => ({
  useGame: () => mockUseGame()
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate
}));

const mockOn = vi.fn();
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();

const mockWSServiceInstance = {
  on: mockOn,
  connect: mockConnect,
  disconnect: mockDisconnect,
  isConnected: false
};

vi.mock("@/services/WSService", () => ({
  createWSService: vi.fn(() => mockWSServiceInstance)
}));

const mockGetGames = vi.fn();
vi.mock("@/services/HttpService", () => ({
  createHttpService: vi.fn(() => ({
    getGames: mockGetGames
  }))
}));

vi.mock("./components/MenuLayout", () => ({
  default: vi.fn(() => <div>MenuLayout renderizado</div>)
}));

describe("Menu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetGames.mockResolvedValue([
      { id: "g1", name: "Juego 1", players_ids: ["p1"] }
    ]);

    mockWSServiceInstance.isConnected = false;
  });

  it("renderiza MenuLayout con las props correctas", async () => {
    await act(async () => render(<Menu />));
    expect(MenuLayout).toHaveBeenCalled();
    expect(MenuLayout.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        games: expect.any(Array),
        joinGame: expect.any(Function),
        createGame: expect.any(Function),
        formRef: expect.any(Object)
      })
    );
  });

  it("createGame llama a createGameContext y navega al lobby", async () => {
    mockCreateGameContext.mockResolvedValue({ id: "game-123" });
    await act(async () => render(<Menu />));

    const props = MenuLayout.mock.calls[0][0];

    await act(async () => {
      await props.createGame({ name: "Nueva partida", password: "pass123", min: 3, max: 4 });
    });

    expect(mockCreateGameContext).toHaveBeenCalledWith(
      { name: "Nueva partida", password: "pass123", min: 3, max: 4 },
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
      { id: "u1", name: "Camila", birthday: "2000-01-01" },
      null
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

    const calls = mockOn.mock.calls;
    const addHandler = calls.find(c => c[0] === "gameAdd")[1];
    const joinHandler = calls.find(c => c[0] === "joinPlayerToGame")[1];
    const unavailableHandler = calls.find(c => c[0] === "gameUnavailable")[1];

    act(() => {
      addHandler({ id: "g2", name: "Nuevo juego", players_ids: [] });
    });
    const propsAfterAdd = MenuLayout.mock.calls.at(-1)[0];
    expect(propsAfterAdd.games.some(g => g.id === "g2")).toBe(true);

    act(() => {
      joinHandler({ id: "g1", players_ids: ["p1", "p2"] });
    });
    const propsAfterJoin = MenuLayout.mock.calls.at(-1)[0];
    expect(propsAfterJoin.games.find(g => g.id === "g1").countPlayers).toBe(2);

    act(() => {
      unavailableHandler({ id: "g1" });
    });
    const propsAfterUnavailable = MenuLayout.mock.calls.at(-1)[0];
    expect(propsAfterUnavailable.games.some(g => g.id === "g1")).toBe(false);
  });

  it("muestra el spinner de carga y luego el layout", async () => {
    mockGetGames.mockResolvedValue([]);
    render(<Menu />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
    expect(screen.getByText("MenuLayout renderizado")).toBeInTheDocument();
  });

  describe("Validación de usuario incompleto", () => {
    beforeEach(() => {
      mockUseGame.mockReturnValue({
        user: { id: "u1", name: null, birthday: null },
        joinGameContext: mockJoinGameContext,
        createGameContext: mockCreateGameContext
      });
      vi.spyOn(window, "alert").mockImplementation(() => {});
    });

    afterEach(() => {
      window.alert.mockRestore();
    });

    const setupIncompleteUserTest = async () => {
      const mockFocus = vi.fn();
      const mockQuerySelector = vi.fn(() => ({ focus: mockFocus }));
      await act(async () => render(<Menu />));
      const props = MenuLayout.mock.calls[0][0];
      props.formRef.current = {
        querySelector: mockQuerySelector
      };
      return { props, mockFocus, mockQuerySelector };
    };

    it("impide crear partida y hace focus si el usuario no está completo", async () => {
      const { props, mockFocus, mockQuerySelector } =
        await setupIncompleteUserTest();

      await act(async () => {
        await props.createGame({ name: "Test" });
      });

      expect(window.alert).toHaveBeenCalledWith(
        "Debes completar el registro antes de unirte a una partida"
      );
      expect(mockQuerySelector).toHaveBeenCalledWith("input");
      expect(mockFocus).toHaveBeenCalled();
      expect(mockCreateGameContext).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("impide unirse a partida y hace focus si el usuario no está completo", async () => {
      const { props, mockFocus, mockQuerySelector } =
        await setupIncompleteUserTest();

      await act(async () => {
        await props.joinGame({ id: "g1" });
      });

      expect(window.alert).toHaveBeenCalledWith(
        "Debes completar el registro antes de unirte a una partida"
      );
      expect(mockQuerySelector).toHaveBeenCalledWith("input");
      expect(mockFocus).toHaveBeenCalled();
      expect(mockJoinGameContext).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Manejo de Errores", () => {
    let consoleErrorSpy;

    beforeEach(() => {
      mockUseGame.mockReturnValue({
        user: { id: "u1", name: "Camila", birthday: "2000-01-01" },
        joinGameContext: mockJoinGameContext,
        createGameContext: mockCreateGameContext
      });

      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it("maneja un error al cargar los juegos (init)", async () => {
      const error = new Error("Fallo al obtener juegos");
      mockGetGames.mockRejectedValue(error);

      await act(async () => render(<Menu />));

      expect(mockGetGames).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to initialize app:",
        error
      );
      await waitFor(() => {
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
      });
    });

    it("maneja un error al crear la partida", async () => {
      const error = new Error("Error de red");
      mockCreateGameContext.mockRejectedValue(error);

      await act(async () => render(<Menu />));
      const props = MenuLayout.mock.calls[0][0];

      await act(async () => {
        await props.createGame({ name: "Juego fallido" });
      });

      expect(mockCreateGameContext).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error creando partida:",
        error
      );
    });

    it("maneja un error al unirse a la partida", async () => {
      const error = new Error("Error de red");
      mockJoinGameContext.mockRejectedValue(error);

      await act(async () => render(<Menu />));
      const props = MenuLayout.mock.calls[0][0];

      let errorCaught = false;
      try {
        await act(async () => {
          await props.joinGame({ id: "g1" });
        });
      } catch (e) {
        errorCaught = true;
        expect(e).toBe(error);
      }
      expect(errorCaught).toBe(true);
      expect(mockJoinGameContext).toHaveBeenCalledWith(
        { id: "g1" },
        { id: "u1", name: "Camila", birthday: "2000-01-01" },
        null
      );
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "❌ Error uniéndote a la partida:",
        error
      );
    });
  });

  describe("Casos Borde de WebSocket", () => {
    it("muestra advertencia si el WS ya está conectado", async () => {
      mockWSServiceInstance.isConnected = true;

      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      await act(async () => render(<Menu />));

      await act(() => new Promise(r => setTimeout(r, 600)));

      expect(mockConnect).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "WebSocket is already connected. Reusing existing connection."
      );

      consoleWarnSpy.mockRestore();
    });

    it("ignora el evento gameAdd si el juego ya existe en la lista", async () => {
      await act(async () => render(<Menu />));

      const propsInitial = MenuLayout.mock.calls.at(-1)[0];
      expect(propsInitial.games).toHaveLength(1);
      expect(propsInitial.games[0].id).toBe("g1");

      const addHandler = mockOn.mock.calls.find(c => c[0] === "gameAdd")[1];

      act(() => {
        addHandler({ id: "g1", name: "Juego 1 Repetido", players_ids: ["p1"] });
      });

      const propsAfterDuplicate = MenuLayout.mock.calls.at(-1)[0];
      expect(propsAfterDuplicate.games).toHaveLength(1);
    });
  });
});
