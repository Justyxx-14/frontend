import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LobbyLayout from "./LobbyLayout";

describe("LobbyLayout", () => {
  const baseProps = {
    currentGame: {
      name: "Dark Castle",
      host_id: "owner123",
      min_players: 3,
    },
    idPlayer: "owner123",
    dataPlayers: {
      p1: "Alice",
      p2: "Bob",
    },
    startGame: vi.fn(),
  };

  it("renderiza el nombre del lobby y los jugadores", () => {
    render(<LobbyLayout {...baseProps} />);
    expect(screen.getByText("Lobby: Dark Castle")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("no muestra el botón Start Game si el usuario no es el dueño", () => {
    render(<LobbyLayout {...baseProps} idPlayer="notOwner" />);
    expect(screen.queryByText("Start Game")).toBeNull();
  });

  it("muestra el botón Start Game si el usuario es el dueño", () => {
    render(<LobbyLayout {...baseProps} />);
    expect(screen.getByText("Start Game")).toBeInTheDocument();
  });

  it("deshabilita el botón Start Game si hay menos jugadores que el mínimo", () => {
    const props = {
      ...baseProps,
      dataPlayers: { p1: "Alice", p2: "Bob" },
    };

    render(<LobbyLayout {...props} />);
    const button = screen.getByRole("button", { name: /start game/i });
    expect(button).toBeDisabled();
  });

  it("habilita el botón Start Game si hay jugadores suficientes", () => {
    const props = {
      ...baseProps,
      dataPlayers: { p1: "Alice", p2: "Bob", p3: "Charlie" },
    };

    render(<LobbyLayout {...props} />);
    const button = screen.getByText("Start Game");
    expect(button).toBeEnabled();
  });

  it("llama a startGame cuando se hace click en el botón habilitado", () => {
    const startGameMock = vi.fn();
    const props = {
      ...baseProps,
      dataPlayers: { p1: "Alice", p2: "Bob", p3: "Charlie" },
      startGame: startGameMock,
    };

    render(<LobbyLayout {...props} />);
    const button = screen.getByText("Start Game");
    fireEvent.click(button);
    expect(startGameMock).toHaveBeenCalled();
  });
});
