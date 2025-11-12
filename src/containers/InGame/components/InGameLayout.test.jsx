import {
  render,
  screen,
  fireEvent,
  within,
  waitFor
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InGameLayout from "./InGameLayout";
import React from "react";

vi.mock("./PlayerLayout", () => ({
  default: props => (
    <div data-testid={`player-${props.player.name}`}>
      <button onClick={props.onSecretButtonClick}>Secrets</button>
      <button onClick={props.onSetsButtonClick}>Sets</button>
    </div>
  )
}));

vi.mock("./CardZoomModal", () => ({
  default: ({ isOpen, cards }) =>
    isOpen ? (
      <div data-testid="card-zoom-modal">
        {cards.map(card => (
          <div key={card.id}>{card.name}</div>
        ))}
      </div>
    ) : null
}));

vi.mock("./SecretButton", () => ({
  default: props => (
    <button data-testid="secret-button" onClick={props.onClick}>
      Secrets
    </button>
  )
}));

vi.mock("./SetsButton", () => ({
  default: props => (
    <button data-testid="sets-button" onClick={props.onClick}>
      Sets
    </button>
  )
}));

vi.mock("lucide-react", () => ({
  Trash2: () => <div data-testid="icon-trash" />,
  Search: () => <div data-testid="icon-search" />,
  HelpCircle: () => <div data-testid="icon-help" />,
  CirclePlus: () => <div data-testid="icon-circle-plus" />
}));

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const filterProps = props => {
    const { whileHover, whileTap, animate, transition, ...rest } = props;
    return rest;
  };

  return {
    motion: {
      div: React.forwardRef(({ children, ...props }, ref) => (
        <div {...filterProps(props)} ref={ref}>
          {children}
        </div>
      )),
      button: React.forwardRef(({ children, ...props }, ref) => (
        <button {...filterProps(props)} ref={ref}>
          {children}
        </button>
      )),
      img: React.forwardRef(({ children, ...props }, ref) => (
        <img {...filterProps(props)} ref={ref}>
          {children}
        </img>
      )),
      circle: React.forwardRef(({ children, ...props }, ref) => (
        <circle {...filterProps(props)} ref={ref}>
          {children}
        </circle>
      ))
    },
    AnimatePresence: ({ children }) => <>{children}</>,
    useAnimationControls: () => ({
      start: vi.fn(),
      stop: vi.fn()
    })
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
  const mockHandlePlayCard = vi.fn();
  const mockOnShowHelp = vi.fn();

  const defaultProps = {
    currentPlayer: { name: "You", socialDisgrace: false },
    otherPlayers: [
      ["player-2", { name: "Alice" }],
      ["player-3", { name: "Bob" }]
    ],
    currentTurnID: "player-1",
    isCurrentTurn: true,
    inventoryCards: [
      { id: "card1", name: "CARD_1", type: "EVENT" },
      { id: "card2", name: "CARD_2", type: "EVENT" }
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
    handlePlayCard: mockHandlePlayCard,
    canNoSoFast: false,
    onShowHelp: mockOnShowHelp
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Core Rendering and Actions", () => {
    it("renders Discard and End Turn buttons", () => {
      render(<InGameLayout {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: /End Turn/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Discard/i })
      ).toBeInTheDocument();
    });
  });

  describe("Modal and Delegated Click Handling", () => {
    it("calls openModal with 'cards' and inventory when Zoom button is clicked", () => {
      render(<InGameLayout {...defaultProps} />);
      const zoomButton = screen.getByTestId("zoom-button");
      fireEvent.click(zoomButton);

      expect(mockOpenModal).toHaveBeenCalledWith(
        "cards",
        defaultProps.inventoryCards
      );
    });
  });

  describe("Confirmation Modal", () => {
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
  });

  describe("Social Disgrace rendering", () => {
    it("renders the Social Disgrace and tooltip when currentPlayer is in social disgrace", () => {
      render(
        <InGameLayout
          {...defaultProps}
          currentPlayer={{ name: "You", socialDisgrace: true }}
        />
      );

      const disgraceImage = screen.getByAltText("Social Disgrace");
      expect(disgraceImage).toBeInTheDocument();
      expect(disgraceImage).toHaveAttribute("src", "/socialDisgrace.webp");
      expect(screen.getByText("Player in social disgrace")).toBeInTheDocument();
    });

    it("does not render the Social Disgrace when currentPlayer isn't in social disgrace", () => {
      render(
        <InGameLayout
          {...defaultProps}
          currentPlayer={{ name: "You", socialDisgrace: false }}
        />
      );
      expect(screen.queryByAltText("Social Disgrace")).not.toBeInTheDocument();
    });
  });

  describe("Conditional Card Buttons", () => {
    it("shows 'Add to Set' button only for a single selected DETECTIVE card", () => {
      const detectiveCard = { id: "d1", name: "Poirot", type: "DETECTIVE" };
      render(
        <InGameLayout
          {...defaultProps}
          inventoryCards={[detectiveCard]}
          selectedCardIds={new Set(["d1"])}
        />
      );

      const addButton = screen.getByTestId("add-detective-button");
      expect(addButton).toBeInTheDocument();

      fireEvent.click(addButton);
      expect(mockHandlePlayCard).toHaveBeenCalledTimes(1);
    });

    it("does NOT show 'Add to Set' button for an EVENT card", () => {
      const eventCard = { id: "e1", name: "Sospecha", type: "EVENT" };
      render(
        <InGameLayout
          {...defaultProps}
          inventoryCards={[eventCard]}
          selectedCardIds={new Set(["e1"])}
        />
      );

      expect(
        screen.queryByTestId("add-detective-button")
      ).not.toBeInTheDocument();
    });

    it("does NOT show 'Add to Set' button for multiple selected cards", () => {
      const detective1 = { id: "d1", name: "Poirot", type: "DETECTIVE" };
      const detective2 = { id: "d2", name: "Marple", type: "DETECTIVE" };
      render(
        <InGameLayout
          {...defaultProps}
          inventoryCards={[detective1, detective2]}
          selectedCardIds={new Set(["d1", "d2"])}
        />
      );

      expect(
        screen.queryByTestId("add-detective-button")
      ).not.toBeInTheDocument();
    });
  });

  describe("Not So Fast (E_NSF) Card Functionality", () => {
    const nsfCard = { id: "nsf1", name: "E_NSF", type: "EVENT" };

    it("makes E_NSF card clickable and animates it when canNoSoFast is true (even if not turn)", () => {
      render(
        <InGameLayout
          {...defaultProps}
          isCurrentTurn={false}
          canNoSoFast={true}
          inventoryCards={[nsfCard]}
          selectedCardIds={new Set()}
        />
      );

      const cardElement = screen.getByAltText("E_NSF");
      expect(cardElement).not.toHaveClass("grayscale brightness-90");
      expect(cardElement.parentElement).toHaveClass("cursor-pointer");

      fireEvent.click(cardElement.parentElement);
      expect(mockHandleCardClick).toHaveBeenCalledWith("nsf1");
    });

    it("enables the main 'Play' button when E_NSF is selected and canNoSoFast is true", () => {
      render(
        <InGameLayout
          {...defaultProps}
          isCurrentTurn={false}
          canNoSoFast={true}
          inventoryCards={[nsfCard]}
          selectedCardIds={new Set(["nsf1"])}
        />
      );

      const playButton = screen.getByRole("button", { name: "Play" });
      expect(playButton).toBeEnabled();

      fireEvent.click(playButton);
      expect(mockHandlePlayCard).toHaveBeenCalledTimes(1);
    });

    it("keeps E_NSF card disabled if canNoSoFast is false and not current turn", () => {
      render(
        <InGameLayout
          {...defaultProps}
          isCurrentTurn={false}
          canNoSoFast={false}
          inventoryCards={[nsfCard]}
          selectedCardIds={new Set()}
        />
      );

      const cardElement = screen.getByAltText("E_NSF");
      expect(cardElement).toHaveClass("grayscale brightness-90");
      expect(cardElement.parentElement).toHaveClass("cursor-not-allowed");

      const spinnerContainer = cardElement.parentElement.querySelector(
        "div[class*='border-t-transparent']"
      );
      expect(spinnerContainer).not.toBeInTheDocument();
      const playButton = screen.getByRole("button", { name: "Play" });
      expect(playButton).toBeDisabled();
    });
  });
});
