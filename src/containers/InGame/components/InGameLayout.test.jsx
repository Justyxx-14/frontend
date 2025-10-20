import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InGameLayout from "./InGameLayout";

// Mock child components
vi.mock("./PlayerLayout", () => ({
  default: (props) => (
    <div data-testid={`player-${props.player.name}`}>
      <button onClick={props.onSecretButtonClick}>Secrets</button>
      <button onClick={props.onSetsButtonClick}>Sets</button>
    </div>
  ),
}));

vi.mock("./CardZoomModal", () => ({
  default: ({ isOpen, cards }) =>
    isOpen ? (
      <div data-testid="card-zoom-modal">
        {cards.map((card) => (
          <div key={card.id}>{card.name}</div>
        ))}
      </div>
    ) : null,
}));

// Mock framer-motion to simplify testing
vi.mock("framer-motion", async () => {
  const React = await import("react");
  return {
    motion: {
      div: React.forwardRef(({ children, ...props }, ref) => (
        <div {...props} ref={ref}>
          {children}
        </div>
      )),
      button: React.forwardRef(({ children, ...props }, ref) => (
        <button {...props} ref={ref}>
          {children}
        </button>
      )),
      img: React.forwardRef(({ children, ...props }, ref) => (
        <img {...props} ref={ref}>
          {children}
        </img>
      )),
    },
  };
});

describe("InGameLayout Component", () => {
  const mockHandleDiscard = vi.fn();
  const mockHandleNextTurnRequest = vi.fn();
  const mockHandleCardClick = vi.fn();
  const mockHandleDrawDraftCard = vi.fn();
  const mockOnShowSecrets = vi.fn();
  const mockOnShowSets = vi.fn();
  const mockOpenModal = vi.fn();
  const mockOnConfirmNextTurn = vi.fn();
  const mockOnCancelNextTurn = vi.fn();

  const defaultProps = {
    currentPlayer: { name: "You" },
    otherPlayers: [
      ["player-2", { name: "Alice" }],
      ["player-3", { name: "Bob" }],
    ],
    currentTurnID: "player-1",
    isCurrentTurn: true,
    inventoryCards: [
      { id: "card1", name: "CARD_1" },
      { id: "card2", name: "CARD_2" },
    ],
    inventorySecrets: [{ id: "secret-1", name: "SECRET_CARD_1" }],
    selectedCardIds: new Set(["card1"]),
    handleCardClick: mockHandleCardClick,
    handleDiscard: mockHandleDiscard,
    isDiscardButtonEnabled: true,
    inventoryDraftCards: [{ id: "draft-1", name: "DRAFT_CARD_1" }],
    lastCardDiscarded: { id: "discard-1", name: "LAST_DISCARDED" },
    handleDrawDraftCard: mockHandleDrawDraftCard,
    handleNextTurnRequest: mockHandleNextTurnRequest,
    onShowSecrets: mockOnShowSecrets,
    onShowSets: mockOnShowSets,
    openModal: mockOpenModal,
    showConfirmModal: false,
    onConfirmNextTurn: mockOnConfirmNextTurn,
    onCancelNextTurn: mockOnCancelNextTurn,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Core Rendering and Actions", () => {
    it("renders all main sections: other players, decks, and current player area", () => {
      render(<InGameLayout {...defaultProps} />);
      expect(screen.getByTestId("player-Alice")).toBeInTheDocument();
      expect(screen.getByTestId("player-Bob")).toBeInTheDocument();
      expect(screen.getByText("Regular deck")).toBeInTheDocument();
      expect(screen.getByText("Discard deck")).toBeInTheDocument();
      expect(screen.getByText("Draft")).toBeInTheDocument();
      expect(screen.getByText(/\(You\)/i)).toBeInTheDocument();
    });

    it("renders End Turn and Discard buttons enabled when it's the player's turn", () => {
      render(<InGameLayout {...defaultProps} />);
      const endTurnButton = screen.getByRole("button", { name: /End Turn/i });
      const discardButton = screen.getByRole("button", { name: /Discard/i });

      expect(endTurnButton).toBeEnabled();
      expect(discardButton).toBeEnabled();
    });

    it("renders End Turn and Discard buttons disabled when it's not the player's turn", () => {
      render(<InGameLayout {...defaultProps} isCurrentTurn={false} />);
      const endTurnButton = screen.getByRole("button", { name: /End Turn/i });
      const discardButton = screen.getByRole("button", { name: /Discard/i });

      expect(endTurnButton).toBeDisabled();
      expect(discardButton).toBeDisabled();
    });
  });

  describe("Modal and Delegated Click Handling", () => {
    it("calls onShowSecrets when the player's own secret button is clicked", () => {
      render(<InGameLayout {...defaultProps} />);

      const buttonSection = screen.getByText(/\(You\)/i).closest("div").nextSibling;
      const secretsButton = within(buttonSection).getByTestId("secret-button");
      fireEvent.click(secretsButton);
      expect(mockOnShowSecrets).toHaveBeenCalledTimes(1);
    });
    
    it("calls openModal with 'cards' and inventory when Zoom button is clicked", () => {
      render(<InGameLayout {...defaultProps} />);
      const zoomButton = screen.getByTestId("zoom-button");
      fireEvent.click(zoomButton);

      expect(mockOpenModal).toHaveBeenCalledWith(
        "cards",
        defaultProps.inventoryCards
      );
    });

    it("calls onShowSecrets with the correct player ID when another player's secrets button is clicked", () => {
      render(<InGameLayout {...defaultProps} />);
      const alicePlayer = screen.getByTestId("player-Alice");
      const aliceSecretsButton = alicePlayer.querySelector("button");
      fireEvent.click(aliceSecretsButton);
      expect(mockOnShowSecrets).toHaveBeenCalledWith("player-2");
    });

    it("calls onShowSets when the player's own sets button is clicked", () => {
      render(<InGameLayout {...defaultProps} />);
      const buttonSection = screen.getByText(/\(You\)/i).closest("div").nextSibling;
      const setsButton = within(buttonSection).getByRole("button", { name: "S" });
      fireEvent.click(setsButton);

      expect(mockOnShowSets).toHaveBeenCalledTimes(1);
    });

    it("calls onShowSets with the correct player ID when another player's sets button is clicked", () => {
      render(<InGameLayout {...defaultProps} />);
      const alicePlayer = screen.getByTestId("player-Alice");
      const aliceSetsButton = within(alicePlayer).getByRole("button", { name: "Sets" });
      fireEvent.click(aliceSetsButton);

      expect(defaultProps.onShowSets).toHaveBeenCalledWith("player-2");
    });
  });

  describe("Confirmation Modal", () => {
    it("does not render the confirmation modal by default", () => {
      render(<InGameLayout {...defaultProps} />);
      expect(screen.queryByText(/Are you sure/i)).not.toBeInTheDocument();
    });

    it("renders the confirmation modal when showConfirmModal is true", () => {
      render(<InGameLayout {...defaultProps} showConfirmModal={true} />);
      expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Cancel/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Confirm/i })
      ).toBeInTheDocument();
    });

    it("calls onConfirmNextTurn when the Confirm button is clicked", () => {
      render(<InGameLayout {...defaultProps} showConfirmModal={true} />);
      fireEvent.click(screen.getByRole("button", { name: /Confirm/i }));
      expect(mockOnConfirmNextTurn).toHaveBeenCalledTimes(1);
    });

    it("calls onCancelNextTurn when the Cancel button is clicked", () => {
      render(<InGameLayout {...defaultProps} showConfirmModal={true} />);
      fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
      expect(mockOnCancelNextTurn).toHaveBeenCalledTimes(1);
    });
  });
});
