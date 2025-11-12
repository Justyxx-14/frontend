import { render, screen, fireEvent} from "@testing-library/react";
import Table from "./Table";
import { describe, it, vi, expect } from "vitest";

// Mock del PasswordModal para evitar problemas en los tests
vi.mock("./PasswordModal", () => ({
  default: vi.fn(({ isOpen, onClose, onConfirm, gameName, error }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="password-modal">
        <div>Password Modal: {gameName}</div>
        {error && <div data-testid="error-message">{error}</div>}
        <button onClick={onClose}>Modal Cancel</button>
        <button onClick={() => onConfirm("test-password")}>Modal Confirm</button>
      </div>
    );
  })
}));

describe("Table", () => {
  const gamesMock = [
    { id: 1, name: "Partida A", players_ids: [1, 2], min_players: 2, max_players: 4, password: "secret123", hasPassword: true },
    { id: 2, name: "Partida B", players_ids: [1], min_players: 2, max_players: 3, password: null, hasPassword: false },
    { id: 3, name: "Partida C", players_ids: [1, 2, 3], min_players: 2, max_players: 6, hasPassword: false },
  ];

  it("debe renderizar las filas según games", () => {
    const mockDoubleClick = vi.fn();
    const gamesWithCounts = gamesMock.map(g => ({
      ...g,
      countPlayers: g.players_ids.length,
    }));

    render(<Table games={gamesWithCounts} eventDoubleClick={mockDoubleClick} />);

    expect(screen.getByText("Partida A")).toBeInTheDocument();
    expect(screen.getByText("Partida B")).toBeInTheDocument();
    expect(screen.getByText("Partida C")).toBeInTheDocument();

    expect(screen.getByText("Game's Names")).toBeInTheDocument();
    expect(screen.getByText("Players")).toBeInTheDocument();
    expect(screen.getByText("Access")).toBeInTheDocument();
  });

  it("debe llamar a eventDoubleClick al hacer doble click en una fila pública", () => {
    const mockDoubleClick = vi.fn();
    const gamesWithCounts = gamesMock.map(g => ({
      ...g,
      countPlayers: g.players_ids.length,
    }));
    
    render(<Table games={gamesWithCounts} eventDoubleClick={mockDoubleClick} />);

    // Usar Partida B (índice 1) que es pública (password: null)
    const row = screen.getByText("Partida B").closest("tr");
    fireEvent.doubleClick(row);

    expect(mockDoubleClick).toHaveBeenCalledWith(gamesWithCounts[1]);
  });

  it("debe abrir modal de contraseña al hacer doble click en partida privada", () => {
    const mockDoubleClick = vi.fn();
    const mockValidateForm = vi.fn().mockReturnValue(true);
    const gamesWithCounts = gamesMock.map(g => ({
      ...g,
      countPlayers: g.players_ids.length,
    }));

    render(<Table games={gamesWithCounts} eventDoubleClick={mockDoubleClick} validateForm={mockValidateForm} />);

    // Usar Partida A (índice 0) que es privada (tiene password)
    const row = screen.getByText("Partida A").closest("tr");
    fireEvent.doubleClick(row);

    // Debería abrirse el modal en lugar de llamar directamente a eventDoubleClick
    expect(screen.getByTestId("password-modal")).toBeInTheDocument();
    expect(screen.getByText("Password Modal: Partida A")).toBeInTheDocument();
    expect(mockDoubleClick).not.toHaveBeenCalled(); // No se debe llamar directamente
  });

  it("debe mostrar spinner si games está vacío", () => {
    render(<Table games={[]} eventDoubleClick={vi.fn()} />);

    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
  });

  it("debe mostrar 'Private' con icono de candado para partidas con contraseña", () => {
    const gamesWithCounts = gamesMock.map(g => ({
      ...g,
      countPlayers: g.players_ids.length,
    }));

    render(<Table games={gamesWithCounts} eventDoubleClick={vi.fn()} />);

    // Buscar por el texto "Private" y verificar que está presente
    expect(screen.getByText("Private")).toBeInTheDocument();

    // Buscar el ícono de Lock (puedes usar data-testid, role, o className)
    const privateIcons = screen.getAllByText("Private");
    const privateElement = privateIcons[0].closest("span");
    expect(privateElement).toHaveClass("text-yellow-400");
  });

  it("debe mostrar 'Public' con icono de globo para partidas públicas", () => {
    const gamesWithCounts = gamesMock.map(g => ({
      ...g,
      countPlayers: g.players_ids.length,
    }));

    render(<Table games={gamesWithCounts} eventDoubleClick={vi.fn()} />);

    // Buscar por el texto "Public" - usar getAllByText ya que hay múltiples
    const publicElements = screen.getAllByText("Public");
    expect(publicElements).toHaveLength(2); // Partida B y Partida C

    // Verificar que todos tienen la clase correcta
    publicElements.forEach(element => {
      expect(element).toHaveClass("text-green-400");
    });
  });


  it("debe tratar partidas sin campo password como públicas", () => {
    const gamesWithCounts = gamesMock.map(g => ({
      ...g,
      countPlayers: g.players_ids.length,
    }));
    
    render(<Table games={gamesWithCounts} eventDoubleClick={vi.fn()} />);
  
    // La partida C no tiene campo password, debería mostrarse como pública
    const publicElements = screen.getAllByText("Public");
    expect(publicElements).toHaveLength(2); // Partida B y Partida C
  });

  it("debe mostrar contador de jugadores en rojo cuando es menor al mínimo", () => {
    const gamesWithCounts = gamesMock.map(g => ({
      ...g,
      countPlayers: g.players_ids.length,
    }));
    
    render(<Table games={gamesWithCounts} eventDoubleClick={vi.fn()} />);

    // Partida B tiene 1 jugador pero mínimo 2 - debería estar en rojo
    const playerCount = screen.getByText("1");
    expect(playerCount).toHaveClass("text-red-500");
  });

  it("debe mostrar contador de jugadores en verde cuando es mayor o igual al mínimo", () => {
    const gamesWithCounts = gamesMock.map(g => ({
      ...g,
      countPlayers: g.players_ids.length,
    }));
    
    render(<Table games={gamesWithCounts} eventDoubleClick={vi.fn()} />);

    // Partida A tiene 2 jugadores y mínimo 2 - debería estar en verde
    const playerCount = screen.getByText("2");
    expect(playerCount).toHaveClass("text-green-500");
  });

  it("debe detenerse si validateForm retorna false", () => {
    const mockDoubleClick = vi.fn();
    const mockValidateForm = vi.fn().mockReturnValue(false); // ← Mock que retorna false
    const gamesWithCounts = gamesMock.map(g => ({
      ...g,
      countPlayers: g.players_ids.length,
    }));
  
    render(
      <Table 
        games={gamesWithCounts} 
        eventDoubleClick={mockDoubleClick} 
        validateForm={mockValidateForm} 
      />
    );
  
    // Intentar hacer doble click en cualquier partida
    const row = screen.getByText("Partida A").closest("tr");
    fireEvent.doubleClick(row);
  
    // Verificar que validateForm fue llamado
    expect(mockValidateForm).toHaveBeenCalledTimes(1);
    
    // Verificar que NO se abrió el modal
    expect(screen.queryByTestId("password-modal")).not.toBeInTheDocument();
    
    // Verificar que NO se llamó a eventDoubleClick
    expect(mockDoubleClick).not.toHaveBeenCalled();
  });
  
  it("debe continuar normalmente si validateForm retorna true", () => {
    const mockDoubleClick = vi.fn();
    const mockValidateForm = vi.fn().mockReturnValue(true); // ← Mock que retorna true
    const gamesWithCounts = gamesMock.map(g => ({
      ...g,
      countPlayers: g.players_ids.length,
    }));
  
    render(
      <Table 
        games={gamesWithCounts} 
        eventDoubleClick={mockDoubleClick} 
        validateForm={mockValidateForm} 
      />
    );
  
    // Hacer doble click en partida pública
    const row = screen.getByText("Partida B").closest("tr");
    fireEvent.doubleClick(row);
  
    // Verificar que validateForm fue llamado
    expect(mockValidateForm).toHaveBeenCalledTimes(1);
    
    // Verificar que se llamó a eventDoubleClick (porque la partida es pública)
    expect(mockDoubleClick).toHaveBeenCalledWith(gamesWithCounts[1]);
  });
  
  it("debe funcionar normalmente cuando validateForm no está definido", () => {
    const mockDoubleClick = vi.fn();
    const gamesWithCounts = gamesMock.map(g => ({
      ...g,
      countPlayers: g.players_ids.length,
    }));
  
    // No pasar validateForm (será undefined)
    render(
      <Table 
        games={gamesWithCounts} 
        eventDoubleClick={mockDoubleClick} 
      />
    );
  
    // Hacer doble click en partida pública
    const row = screen.getByText("Partida B").closest("tr");
    fireEvent.doubleClick(row);
  
    // Verificar que se llamó a eventDoubleClick normalmente
    expect(mockDoubleClick).toHaveBeenCalledWith(gamesWithCounts[1]);
  });


});

describe("Password Modal Interactions", () => {
  const gamesMock = [
    { id: 1, name: "Partida A", players_ids: [1, 2], min_players: 2, max_players: 4, password: "secret123", hasPassword: true },
    { id: 2, name: "Partida B", players_ids: [1], min_players: 2, max_players: 3, password: null, hasPassword: false },
  ];

  it("debe cerrar el modal y limpiar errores al cancelar", () => {
    const mockDoubleClick = vi.fn();
    const validateForm = vi.fn().mockReturnValue(true);
    const gamesWithCounts = gamesMock.map(g => ({
      ...g,
      countPlayers: g.players_ids.length,
    }));

    render(<Table games={gamesWithCounts} eventDoubleClick={mockDoubleClick} validateForm={validateForm} />);

    // Abrir modal
    const row = screen.getByText("Partida A").closest("tr");
    fireEvent.doubleClick(row);
    expect(screen.getByTestId("password-modal")).toBeInTheDocument();

    // Cerrar modal
    fireEvent.click(screen.getByText("Modal Cancel"));
    expect(screen.queryByTestId("password-modal")).not.toBeInTheDocument();
  });

  it("debe manejar confirmación de contraseña exitosa", async () => {
    const mockDoubleClick = vi.fn().mockResolvedValue(true);
    const validateForm = vi.fn().mockReturnValue(true);
    const gamesWithCounts = gamesMock.map(g => ({
      ...g,
      countPlayers: g.players_ids.length,
    }));

    render(<Table games={gamesWithCounts} eventDoubleClick={mockDoubleClick} validateForm={validateForm} />);

    // Abrir modal
    const row = screen.getByText("Partida A").closest("tr");
    fireEvent.doubleClick(row);

    // Confirmar contraseña
    fireEvent.click(screen.getByText("Modal Confirm"));

    // Esperar a que se resuelva la promesa
    await vi.waitFor(() => {
      expect(mockDoubleClick).toHaveBeenCalledWith(gamesWithCounts[0], "test-password");
    });
  });


  it("debe manejar error de contraseña incorrecta", async () => {
    const mockDoubleClick = vi.fn().mockRejectedValue({
      response: { data: { detail: "Wrong password" } }
    });
    const validateForm = vi.fn().mockReturnValue(true);
    const gamesWithCounts = gamesMock.map(g => ({
      ...g,
      countPlayers: g.players_ids.length,
    }));

    render(<Table games={gamesWithCounts} eventDoubleClick={mockDoubleClick} validateForm={validateForm} />);

    // Abrir modal
    const row = screen.getByText("Partida A").closest("tr");
    fireEvent.doubleClick(row);

    // Confirmar contraseña (debería fallar)
    fireEvent.click(screen.getByText("Modal Confirm"));

    await vi.waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeInTheDocument();
    });
  });

  it("debe manejar error de contraseña requerida", async () => {
    const mockDoubleClick = vi.fn().mockRejectedValue({
      response: { data: { detail: "Password required" } }
    });
    const validateForm = vi.fn().mockReturnValue(true);
    const gamesWithCounts = gamesMock.map(g => ({
      ...g,
      countPlayers: g.players_ids.length,
    }));

    render(<Table games={gamesWithCounts} eventDoubleClick={mockDoubleClick} validateForm={validateForm} />);

    // Abrir modal
    const row = screen.getByText("Partida A").closest("tr");
    fireEvent.doubleClick(row);

    // Confirmar contraseña (debería fallar)
    fireEvent.click(screen.getByText("Modal Confirm"));

    await vi.waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeInTheDocument();
    });
  });

  it("debe manejar error genérico al unirse a la partida", async () => {
    const mockDoubleClick = vi.fn().mockRejectedValue({
      message: "Network error"
    });
    const validateForm = vi.fn().mockReturnValue(true);
    const gamesWithCounts = gamesMock.map(g => ({
      ...g,
      countPlayers: g.players_ids.length,
    }));

    render(<Table games={gamesWithCounts} eventDoubleClick={mockDoubleClick} validateForm={validateForm} />);

    // Abrir modal
    const row = screen.getByText("Partida A").closest("tr");
    fireEvent.doubleClick(row);

    // Confirmar contraseña (debería fallar)
    fireEvent.click(screen.getByText("Modal Confirm"));

    await vi.waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeInTheDocument();
    });
  });

});