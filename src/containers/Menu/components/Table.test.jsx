import { render, screen, fireEvent} from "@testing-library/react";
import Table from "./Table";
import { describe, it, vi, expect } from "vitest";

describe("Table", () => {
  const gamesMock = [
    { id: 1, name: "Partida A", players_ids: [1, 2], min_players: 2, max_players: 4 },
    { id: 2, name: "Partida B", players_ids: [1], min_players: 2, max_players: 3 },
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

    const tdA = screen.getAllByRole("cell").find(td =>
      td.textContent.includes("2/4")
    );
    expect(tdA).toBeInTheDocument();

    const tdB = screen.getAllByRole("cell").find(td =>
      td.textContent.includes("1/3")
    );
    expect(tdB).toBeInTheDocument();
  });

  it("debe llamar a eventDoubleClick al hacer doble click en una fila", () => {
    const mockDoubleClick = vi.fn();
    render(<Table games={gamesMock} eventDoubleClick={mockDoubleClick} />);

    const row = screen.getByText("Partida A").closest("tr");
    fireEvent.doubleClick(row);

    expect(mockDoubleClick).toHaveBeenCalledWith(gamesMock[0]);
  });

  it("debe mostrar spinner si games está vacío", () => {
    render(<Table games={[]} eventDoubleClick={vi.fn()} />);

    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
  });
});