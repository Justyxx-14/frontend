import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SelectionModal from "./SelectionModal";

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const forwardRef = Component =>
    React.forwardRef(({ children, ...props }, ref) => (
      <Component {...props} ref={ref}>
        {children}
      </Component>
    ));

  return {
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: {
      div: forwardRef("div"),
      h2: forwardRef("h2"),
      img: forwardRef("img")
    }
  };
});

describe("SelectionModal Component", () => {
  const mockOnSelect = vi.fn();

  const cardItems = [
    { id: "card-1", name: "Sospecha" },
    { id: "card-2", name: "Analisis" }
  ];
  const playerItems = [
    { id: "player-1", name: "Alice" },
    { id: "player-2", name: "Bob" }
  ];
  const secretItems = [
    {
      id: "secret-1",
      name: "TheMotive",
      owner_player_id: "viewer-id",
      revealed: false
    },
    {
      id: "secret-2",
      name: "TheAccomplice",
      owner_player_id: "other-player",
      revealed: true
    },
    {
      id: "secret-3",
      name: "TheWeapon",
      owner_player_id: "other-player",
      revealed: false
    }
  ];

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <SelectionModal isOpen={false} onSelect={mockOnSelect} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the title and correct items when open", () => {
    render(
      <SelectionModal
        isOpen={true}
        title="Choose an Option"
        items={cardItems}
        itemType="card"
        onSelect={mockOnSelect}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Choose an Option" })
    ).toBeInTheDocument();
    expect(screen.getByAltText("Sospecha")).toBeInTheDocument();
    expect(screen.getByAltText("Analisis")).toBeInTheDocument();
  });

  it("renders player items when itemType is 'player'", () => {
    render(
      <SelectionModal
        isOpen={true}
        title="Select a Player"
        items={playerItems}
        itemType="player"
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("calls onSelect with the correct card ID when a card item is clicked", () => {
    render(
      <SelectionModal
        isOpen={true}
        items={cardItems}
        itemType="card"
        onSelect={mockOnSelect}
      />
    );

    const cardElement = screen.getByAltText("Analisis");
    fireEvent.click(cardElement);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith("card-2");
  });

  it("calls onSelect with the correct player ID when a player item is clicked", () => {
    render(
      <SelectionModal
        isOpen={true}
        items={playerItems}
        itemType="player"
        onSelect={mockOnSelect}
      />
    );

    const playerElement = screen.getByText("Bob").closest("div");
    fireEvent.click(playerElement);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith("player-2");
  });

  describe("when itemType is 'secret'", () => {
    it("renders secret items and shows the correct card face", () => {
      render(
        <SelectionModal
          isOpen={true}
          title="Select a Secret"
          items={secretItems}
          itemType="secret"
          onSelect={mockOnSelect}
          viewingPlayerId="viewer-id"
        />
      );

      const ownSecret = screen.getByAltText("TheMotive");
      expect(ownSecret).toBeInTheDocument();
      expect(ownSecret.src).toContain("/secrets/TheMotive.webp");

      const revealedSecret = screen.getByAltText("TheAccomplice");
      expect(revealedSecret).toBeInTheDocument();
      expect(revealedSecret.src).toContain("/secrets/TheAccomplice.webp");

      const hiddenSecret = screen.getByAltText("Secret card");
      expect(hiddenSecret).toBeInTheDocument();
      expect(hiddenSecret.src).toContain("/secrets/S_BACK.webp");
    });

    it("calls onSelect with the correct secret ID when a secret item is clicked", () => {
      render(
        <SelectionModal
          isOpen={true}
          items={secretItems}
          itemType="secret"
          onSelect={mockOnSelect}
          viewingPlayerId="viewer-id"
        />
      );

      const secretElement = screen.getByAltText("TheAccomplice");
      fireEvent.click(secretElement);

      expect(mockOnSelect).toHaveBeenCalledTimes(1);
      expect(mockOnSelect).toHaveBeenCalledWith("secret-2");
    });
  });
});
