import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, vi, beforeEach, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import EndGame from "./EndGame";

let mockLocationState = {};
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    useLocation: () => ({ state: mockLocationState }),
    useNavigate: () => mockNavigate,
    Link: ({ children, ...props }) => <a {...props}>{children}</a>
  };
});

describe("EndGame Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Estado de ubicación por defecto
    mockLocationState = {
      gameResult: {
        winners: [{ id: "player-1" }, { id: "player-3" }],
        player_roles: [
          { id: "player-1", name: "You", role: "DETECTIVE" },
          { id: "player-2", name: "Alice", role: "MURDERER" },
          { id: "player-3", name: "Bob", role: "DETECTIVE" },
          { id: "player-4", name: "Charlie", role: "ACCOMPLICE" }
        ],
        reason: "MURDERER_REVEALED"
      },
      currentPlayerId: "player-1"
    };
  });

  it("should render all player roles correctly with winner highlights", async () => {
    render(
      <MemoryRouter>
        <EndGame />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("You")).toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Charlie")).toBeInTheDocument();
    });

    const getPlayerImage = playerName =>
      screen.getByText(playerName).closest("div")?.querySelector("img");

    expect(getPlayerImage("You")).toHaveClass("border-yellow-400");
    expect(getPlayerImage("Bob")).toHaveClass("border-yellow-400");
    expect(getPlayerImage("Alice")).toHaveClass("border-gray-600");
    expect(getPlayerImage("Charlie")).toHaveClass("border-gray-600");
  });
});
