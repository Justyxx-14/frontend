import {
  render,
  screen,
  fireEvent,
  waitFor,
  within
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGame } from "@/context/useGame";
import { createHttpService } from "@/services/HttpService";
import { createWSService } from "@/services/WSService";
import { createCardActionsService } from "@/services/CardActionsService";
import { createCardDetectiveService } from "@/services/CardDetectiveService";
import toast from "react-hot-toast";
import InGame from "./InGame";

// Mocks
vi.mock("react-router-dom", () => ({
  useParams: () => ({ gameId: "test-game-id" })
}));
vi.mock("@/context/useGame");
vi.mock("@/services/HttpService");
vi.mock("@/services/WSService");
vi.mock("@/services/CardActionsService");
vi.mock("@/services/CardDetectiveService");
vi.mock("react-hot-toast");

describe("InGame Component Logic", () => {
  const mockCardsByPlayerContext = vi.fn();
  const mockDiscardCardsContext = vi.fn();
  const mockGetDraftCards = vi.fn();
  const mockDrawDraftCard = vi.fn();
  const mockGetLastDiscardedCard = vi.fn();
  const mockRegularDrawCards = vi.fn();
  const mockNextTurnGame = vi.fn();
  const mockGetSecretsGame = vi.fn();
  const mockPlayCardEvent = vi.fn();
  const mockPlaySet = vi.fn();

  const initialHand = [{ id: "hand-1", name: "HAND_CARD" }];
  const initialSecrets = [
    { id: "secret-1", name: "SECRET_CARD", revealed: true }
  ];
  const otherPlayerSecrets = [
    { id: "secret-2", name: "OTHER_SECRET", revealed: true }
  ];

  beforeEach(() => {
    // clean before each test
    vi.clearAllMocks();
    localStorage.clear();

    // Configuration for each mock
    vi.mocked(createHttpService).mockReturnValue({
      getDraftCards: mockGetDraftCards,
      drawDraftCard: mockDrawDraftCard,
      getLastDiscardedCard: mockGetLastDiscardedCard,
      regularDrawCards: mockRegularDrawCards,
      getTurnGame: vi.fn().mockResolvedValue({ id: "player-1" }),
      nextTurnGame: mockNextTurnGame,
      getSecretsGame: mockGetSecretsGame
    });

    vi.mocked(createCardActionsService).mockReturnValue({
      playCardEvent: mockPlayCardEvent
    });

    vi.mocked(createCardDetectiveService).mockReturnValue({
      playSet: mockPlaySet,
      callOtherSecrets: vi.fn()
    });

    vi.mocked(createWSService).mockReturnValue({
      connect: vi.fn(),
      disconnect: vi.fn(),
      on: vi.fn()
    });

    vi.mocked(useGame).mockReturnValue({
      currentGame: { id: "test-game-id" },
      idPlayer: "player-1",
      discardCardsContext: mockDiscardCardsContext,
      cardsByPlayerContext: mockCardsByPlayerContext,
      dataPlayers: { "player-1": "You", "player-2": "Alice" }
    });
  });

  describe("Initialization and Rendering", () => {
    it("fetches and stores all initial game data on render", async () => {
      mockCardsByPlayerContext.mockResolvedValue(initialHand);
      mockGetDraftCards.mockResolvedValue([]);
      mockGetLastDiscardedCard.mockResolvedValue([]);
      mockGetSecretsGame.mockResolvedValue(initialSecrets);

      render(<InGame />);

      await waitFor(() => {
        expect(mockCardsByPlayerContext).toHaveBeenCalledWith(
          "test-game-id",
          "player-1"
        );
        expect(mockGetDraftCards).toHaveBeenCalledWith("test-game-id");
        expect(mockGetLastDiscardedCard).toHaveBeenCalledWith("test-game-id");
        expect(mockGetSecretsGame).toHaveBeenCalledWith(
          "test-game-id",
          "player-1"
        );
      });
    });
  });

  describe("Modal Functionality", () => {
    it("opens the modal with own hand cards when Zoom button is clicked", async () => {
      mockCardsByPlayerContext.mockResolvedValue(initialHand);
      mockGetDraftCards.mockResolvedValue([]);
      mockGetLastDiscardedCard.mockResolvedValue([]);
      mockGetSecretsGame.mockResolvedValue([]);

      render(<InGame />);

      const zoomButton = await screen.findByRole("button", { name: /🔍/i });
      fireEvent.click(zoomButton);

      const modal = await screen.findByRole("dialog", {
        name: /Card zoom modal/i
      });
      const cardInModal = await within(modal).findByAltText("HAND_CARD");
      expect(cardInModal).toBeInTheDocument();
    });

    it("opens the modal with own secrets when own Secrets button is clicked", async () => {
      mockCardsByPlayerContext.mockResolvedValue(initialHand);
      mockGetDraftCards.mockResolvedValue([]);
      mockGetLastDiscardedCard.mockResolvedValue([]);
      mockGetSecretsGame.mockResolvedValue(initialSecrets);

      render(<InGame />);

      // Wait for initial data to load before interacting
      await screen.findByAltText("HAND_CARD");

      const playerSection = screen
        .getByText(/\(You\)/i)
        .closest("div").nextSibling;
      const secretsButton = within(playerSection).getByTestId("secret-button");
      fireEvent.click(secretsButton);

      const modal = await screen.findByRole("dialog", {
        name: /Card zoom modal/i
      });
      const secretCardInModal = within(modal).getByAltText("SECRET_CARD");
      expect(secretCardInModal).toBeInTheDocument();
    });

    it("fetches and opens the modal with another player's secrets when their button is clicked", async () => {
      mockCardsByPlayerContext.mockResolvedValue(initialHand);
      mockGetDraftCards.mockResolvedValue([]);
      mockGetLastDiscardedCard.mockResolvedValue([]);
      mockGetSecretsGame
        .mockResolvedValueOnce(initialSecrets)
        .mockResolvedValueOnce(otherPlayerSecrets);

      render(<InGame />);

      await screen.findByAltText("HAND_CARD");

      const otherPlayerSection = screen
        .getByText("Alice")
        .closest("div").parentElement;
      const otherSecretsButton = within(otherPlayerSection).getByTestId("secret-button");
      fireEvent.click(otherSecretsButton);

      await waitFor(() => {
        expect(mockGetSecretsGame).toHaveBeenCalledWith(
          "test-game-id",
          "player-2"
        );
      });

      const modal = await screen.findByRole("dialog", {
        name: /Card zoom modal/i
      });
      const otherSecretInModal = within(modal).getByAltText("OTHER_SECRET");
      expect(otherSecretInModal).toBeInTheDocument();
    });
  });

  describe("Player Actions", () => {
    it("allows a player to select and discard a card during the 'action' phase", async () => {
      const initialHand = [{ id: "card-to-discard", name: "DISCARD_ME" }];
      mockCardsByPlayerContext.mockResolvedValue(initialHand);
      mockGetDraftCards.mockResolvedValue([]);
      mockGetLastDiscardedCard.mockResolvedValue([]);
      mockGetSecretsGame.mockResolvedValue([]);
      mockDiscardCardsContext.mockResolvedValue({});

      render(<InGame />);
      const card = await screen.findByAltText("DISCARD_ME");
      fireEvent.click(card);

      const discardButton = screen.getByRole("button", { name: /Discard/i });
      fireEvent.click(discardButton);

      await waitFor(() => {
        expect(mockDiscardCardsContext).toHaveBeenCalledWith(
          "test-game-id",
          "player-1",
          ["card-to-discard"]
        );
        expect(screen.queryByAltText("DISCARD_ME")).not.toBeInTheDocument();
        expect(toast.success).toHaveBeenCalledWith("Cards discarded.");
      });
    });

    it("prevents discarding after drawing a card (when phase is 'draw')", async () => {
      localStorage.setItem("game-test-game-id-turnPhase", "draw");
      const initialHand = [{ id: "card-to-discard", name: "DISCARD_ME" }];
      mockCardsByPlayerContext.mockResolvedValue(initialHand);
      mockGetDraftCards.mockResolvedValue([]);
      mockGetLastDiscardedCard.mockResolvedValue([]);
      mockGetSecretsGame.mockResolvedValue([]);

      render(<InGame />);
      const card = await screen.findByAltText("DISCARD_ME");
      fireEvent.click(card);

      const discardButton = screen.getByRole("button", { name: /Discard/i });
      fireEvent.click(discardButton);

      await waitFor(() => {
        expect(mockDiscardCardsContext).not.toHaveBeenCalled();
        expect(screen.getByAltText("DISCARD_ME")).toBeInTheDocument();
        expect(toast.error).toHaveBeenCalledWith(
          "You can't discard after drawing"
        );
      });
    });
  });

  describe("Turn Phase Logic", () => {
    it("prevents playing a card if an action has already been taken (turnPhase is 'noAction')", async () => {
      localStorage.setItem("game-test-game-id-turnPhase", "noAction");
      const eventCard = { id: "event-1", name: "Sospecha", type: "EVENT" };
      mockCardsByPlayerContext.mockResolvedValue([eventCard]);
      mockGetDraftCards.mockResolvedValue([]);
      mockGetLastDiscardedCard.mockResolvedValue([]);
      mockGetSecretsGame.mockResolvedValue([]);

      render(<InGame />);

      const cardElement = await screen.findByAltText("Sospecha");
      fireEvent.click(cardElement);

      const playButton = screen.getByRole("button", { name: /Play Card/i });
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "You can't do more than one action"
        );
        expect(mockPlayCardEvent).not.toHaveBeenCalled();
        expect(screen.getByAltText("Sospecha")).toBeInTheDocument();
      });
    });

    it("prevents playing a card after drawing (turnPhase is 'draw')", async () => {
      localStorage.setItem("game-test-game-id-turnPhase", "draw");
      const eventCard = { id: "event-1", name: "Sospecha", type: "EVENT" };
      mockCardsByPlayerContext.mockResolvedValue([eventCard]);
      mockGetDraftCards.mockResolvedValue([]);
      mockGetLastDiscardedCard.mockResolvedValue([]);
      mockGetSecretsGame.mockResolvedValue([]);

      render(<InGame />);

      const cardElement = await screen.findByAltText("Sospecha");
      fireEvent.click(cardElement);

      const playButton = screen.getByRole("button", { name: /Play Card/i });
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "You can't take an action after drawing or discarding"
        );
        expect(mockPlayCardEvent).not.toHaveBeenCalled();
      });
    });

    it("prevents discarding a card after drawing (turnPhase is 'draw')", async () => {
      localStorage.setItem("game-test-game-id-turnPhase", "draw");
      const cardToDiscard = { id: "c1", name: "DISCARD_ME", type: "EVENT" };
      mockCardsByPlayerContext.mockResolvedValue([cardToDiscard]);
      mockGetDraftCards.mockResolvedValue([]);
      mockGetLastDiscardedCard.mockResolvedValue([]);
      mockGetSecretsGame.mockResolvedValue([]);

      render(<InGame />);

      const cardElement = await screen.findByAltText("DISCARD_ME");
      fireEvent.click(cardElement);

      const discardButton = screen.getByRole("button", { name: /Discard/i });
      fireEvent.click(discardButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "You can't discard after drawing"
        );
        expect(mockDiscardCardsContext).not.toHaveBeenCalled();
      });
    });
  });

  describe("Draft Functionality", () => {
    it("adds a card to inventory and removes it from draft on successful draw", async () => {
      const initialHand = [{ id: "hand-card", name: "HAND_CARD" }];
      const initialDraft = [{ id: "draft-card-1", name: "DRAFT_CARD_1" }];
      const newCard = { id: "draft-card-1", name: "DRAFT_CARD_1" };

      mockCardsByPlayerContext.mockResolvedValue(initialHand);
      mockGetDraftCards.mockResolvedValue(initialDraft);
      mockDrawDraftCard.mockResolvedValue(newCard);
      mockGetSecretsGame.mockResolvedValue([]);

      render(<InGame />);

      const draftCard = await screen.findByAltText("DRAFT_CARD_1");
      fireEvent.click(draftCard);

      await waitFor(() => {
        expect(mockDrawDraftCard).toHaveBeenCalledWith(
          "test-game-id",
          "draft-card-1",
          "player-1"
        );
        expect(screen.getByAltText("HAND_CARD")).toBeInTheDocument();
        expect(screen.getByAltText("DRAFT_CARD_1")).toBeInTheDocument();
      });
    });

    it("shows an error toast and does not change inventories if drawing fails", async () => {
      const initialHand = [{ id: "hand-card", name: "HAND_CARD" }];
      const initialDraft = [{ id: "draft-card-1", name: "DRAFT_CARD_1" }];

      mockCardsByPlayerContext.mockResolvedValue(initialHand);
      mockGetDraftCards.mockResolvedValue(initialDraft);
      mockDrawDraftCard.mockRejectedValue({ response: { status: 409 } });
      mockGetSecretsGame.mockResolvedValue([]);

      const toastSpy = vi.spyOn(toast, "error").mockImplementation(() => {});

      render(<InGame />);
      const draftCard = await screen.findByAltText("DRAFT_CARD_1");
      fireEvent.click(draftCard);

      await waitFor(() => {
        expect(toastSpy).toHaveBeenCalledWith(
          "You can't draw any more cards, limit reached."
        );
        expect(screen.getByAltText("DRAFT_CARD_1")).toBeInTheDocument();
      });
    });
  });

  describe("Card Playing Functionality", () => {
    it("successfully plays a single EVENT card", async () => {
      const eventCard = {
        id: "event-1",
        name: "Sospecha",
        type: "EVENT",
        description: "Suspicion"
      };
      mockCardsByPlayerContext.mockResolvedValue([eventCard]);
      mockGetDraftCards.mockResolvedValue([]);
      mockGetLastDiscardedCard.mockResolvedValue([]);
      mockGetSecretsGame.mockResolvedValue([]);
      mockPlayCardEvent.mockResolvedValue({ success: true });

      localStorage.setItem("game-test-game-id-turnPhase", "action");

      render(<InGame />);

      const cardElement = await screen.findByAltText("Sospecha");
      fireEvent.click(cardElement);

      const playButton = screen.getByRole("button", { name: /Play Card/i });
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(mockPlayCardEvent).toHaveBeenCalledWith(
          expect.objectContaining(eventCard)
        );

        expect(toast.success).toHaveBeenCalledWith("Suspicion card was played");
        expect(screen.queryByAltText("Sospecha")).not.toBeInTheDocument();
      });
    });

    it("does nothing if a single non-EVENT card is played", async () => {
      const detectiveCard = {
        id: "detective-1",
        name: "Investigador",
        type: "DETECTIVE"
      };
      mockCardsByPlayerContext.mockResolvedValue([detectiveCard]);
      mockGetDraftCards.mockResolvedValue([]);
      mockGetLastDiscardedCard.mockResolvedValue([]);
      mockGetSecretsGame.mockResolvedValue([]);

      render(<InGame />);

      const cardElement = await screen.findByAltText("Investigador");
      fireEvent.click(cardElement);

      const playButton = screen.getByRole("button", { name: /Play Card/i });
      fireEvent.click(playButton);

      await new Promise(r => setTimeout(r, 100));

      expect(mockPlayCardEvent).not.toHaveBeenCalled();
      expect(screen.getByAltText("Investigador")).toBeInTheDocument();
    });

    it("shows an error toast if multiple cards are played and not all are DETECTIVE type", async () => {
      const eventCard = { id: "event-1", name: "Sospecha", type: "EVENT" };
      const detectiveCard = {
        id: "detective-1",
        name: "Investigador",
        type: "DETECTIVE"
      };
      mockCardsByPlayerContext.mockResolvedValue([eventCard, detectiveCard]);
      mockGetDraftCards.mockResolvedValue([]);
      mockGetLastDiscardedCard.mockResolvedValue([]);
      mockGetSecretsGame.mockResolvedValue([]);

      render(<InGame />);

      const eventCardElement = await screen.findByAltText("Sospecha");
      const detectiveCardElement = await screen.findByAltText("Investigador");
      fireEvent.click(eventCardElement);
      fireEvent.click(detectiveCardElement);

      const playButton = screen.getByRole("button", { name: /Play Card/i });
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "You can't do more than one action"
        );
        expect(mockPlayCardEvent).not.toHaveBeenCalled();
        expect(screen.getByAltText("Sospecha")).toBeInTheDocument();
        expect(screen.getByAltText("Investigador")).toBeInTheDocument();
      });
    });
  });

  describe("Playing Detective Sets", () => {
    it("successfully plays a set of DETECTIVE cards", async () => {
      const detectiveCards = [
        { id: "d1", name: "HerculePoirot", type: "DETECTIVE" },
        { id: "d2", name: "MissMarple", type: "DETECTIVE" }
      ];
      mockCardsByPlayerContext.mockResolvedValue(detectiveCards);
      mockGetDraftCards.mockResolvedValue([]);
      mockGetLastDiscardedCard.mockResolvedValue([]);
      mockGetSecretsGame.mockResolvedValue([]);
      mockPlaySet.mockResolvedValue({ success: true });

      localStorage.setItem("game-test-game-id-turnPhase", "action");

      render(<InGame />);

      const card1 = await screen.findByAltText("HerculePoirot");
      const card2 = await screen.findByAltText("MissMarple");
      fireEvent.click(card1);
      fireEvent.click(card2);

      const playButton = screen.getByRole("button", { name: /Play Card/i });
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(mockPlaySet).toHaveBeenCalledWith(detectiveCards);
        expect(toast.success).toHaveBeenCalledWith("the set was played");
        expect(screen.queryByAltText("HerculePoirot")).not.toBeInTheDocument();
        expect(screen.queryByAltText("MissMarple")).not.toBeInTheDocument();
      });
    });

    it("shows an error if playing a set fails", async () => {
      const detectiveCards = [
        { id: "d1", name: "HerculePoirot", type: "DETECTIVE" },
        { id: "d2", name: "MissMarple", type: "DETECTIVE" }
      ];
      mockCardsByPlayerContext.mockResolvedValue(detectiveCards);
      mockGetDraftCards.mockResolvedValue([]);
      mockGetLastDiscardedCard.mockResolvedValue([]);
      mockGetSecretsGame.mockResolvedValue([]);
      mockPlaySet.mockRejectedValue(new Error("Invalid set"));

      localStorage.setItem("game-test-game-id-turnPhase", "action");

      render(<InGame />);

      const card1 = await screen.findByAltText("HerculePoirot");
      const card2 = await screen.findByAltText("MissMarple");
      fireEvent.click(card1);
      fireEvent.click(card2);

      const playButton = screen.getByRole("button", { name: /Play Card/i });
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(mockPlaySet).toHaveBeenCalledWith(detectiveCards);
        expect(toast.error).toHaveBeenCalledWith("Invalid set");
        expect(screen.getByAltText("HerculePoirot")).toBeInTheDocument();
      });
    });
  });
});
