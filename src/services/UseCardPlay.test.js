import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import toast from "react-hot-toast";
import { UseCardPlay } from "./UseCardPlay"; // Adjust path as needed

// Mocks
vi.mock("react-hot-toast");

const mockPlayCardEvent = vi.fn();
const mockPlaySet = vi.fn();

const mockCardActionsService = {
  playCardEvent: mockPlayCardEvent
};
const mockCardDetectiveService = {
  playSet: mockPlaySet
};

describe("UseCardPlay Hook", () => {
  let mockSetInventoryCards;
  let mockSetSelectedCardIds;
  // Helper to render the hook with default or provided props
  const renderTestHook = (initialProps = {}) => {
    mockSetInventoryCards = vi.fn();
    mockSetSelectedCardIds = vi.fn();

    const defaultProps = {
      cardActionsService: mockCardActionsService,
      cardDetectiveService: mockCardDetectiveService,
      inventoryCards: [],
      selectedCardIds: new Set(),
      setInventoryCards: mockSetInventoryCards,
      setSelectedCardIds: mockSetSelectedCardIds,

      turnState: "IDLE",
      ...initialProps
    };

    return renderHook(() => UseCardPlay(defaultProps));
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Phase Guards", () => {
    // Test each state that should prevent playing a card
    const forbiddenStates = [
      "DRAWING_CARDS",
      "DISCARDING",
      "CHOOSING_SECRET",
      "END_TURN"
    ];

    forbiddenStates.forEach(state => {
      it(`should show error and return if turnState is '${state}'`, async () => {
        const { result } = renderTestHook({ turnState: state });

        await act(async () => {
          await result.current.handlePlayCard();
        });

        expect(toast.error).toHaveBeenCalledWith(
          "You can't play a card in this moment"
        );
        expect(mockPlayCardEvent).not.toHaveBeenCalled();
        expect(mockPlaySet).not.toHaveBeenCalled();
      });
    });

    it("should show error and return if cardActionsService is null", async () => {
      // Render hook specifically without cardActionsService for this test
      const { result } = renderHook(() =>
        UseCardPlay({
          cardActionsService: null,
          cardDetectiveService: mockCardDetectiveService,
          inventoryCards: [],
          selectedCardIds: new Set(),
          setInventoryCards: vi.fn(),
          setSelectedCardIds: vi.fn(),
          turnState: "IDLE"
        })
      );

      await act(async () => {
        await result.current.handlePlayCard();
      });

      expect(toast.error).toHaveBeenCalledWith("The game isn't ready");
      expect(mockPlayCardEvent).not.toHaveBeenCalled();
      expect(mockPlaySet).not.toHaveBeenCalled();
    });
  });

  describe("Playing Single Event Card", () => {
    const eventCard = {
      id: "e1",
      name: "Sospecha",
      type: "EVENT",
      description: "Suspicion"
    };

    it("should call playCardEvent and update state on success", async () => {
      mockPlayCardEvent.mockResolvedValue({ success: true });
      const { result } = renderTestHook({
        inventoryCards: [eventCard],
        selectedCardIds: new Set([eventCard.id]),
        turnState: "IDLE"
      });

      await act(async () => {
        await result.current.handlePlayCard();
      });

      expect(mockPlayCardEvent).toHaveBeenCalledWith(eventCard);
      expect(mockSetInventoryCards).toHaveBeenCalled();
      expect(mockSetSelectedCardIds).toHaveBeenCalledWith(new Set());
    });

    it("should handle E_LIA card correctly, adding returned card", async () => {
      const eliaCard = { id: "elia1", name: "E_LIA", type: "EVENT" };
      const returnedCard = { id: "newCard", name: "Returned Card" };
      mockPlayCardEvent.mockResolvedValue(returnedCard);
      const { result } = renderTestHook({
        inventoryCards: [eliaCard],
        selectedCardIds: new Set([eliaCard.id]),
        turnState: "IDLE"
      });

      await act(async () => {
        await result.current.handlePlayCard();
      });

      expect(mockPlayCardEvent).toHaveBeenCalledWith(eliaCard);
      expect(mockSetInventoryCards).toHaveBeenCalledTimes(2);
      expect(mockSetSelectedCardIds).toHaveBeenCalledWith(new Set());
    });

    it("should show specific error toast if playCardEvent returns null", async () => {
      mockPlayCardEvent.mockResolvedValue(null);
      const { result } = renderTestHook({
        inventoryCards: [eventCard],
        selectedCardIds: new Set([eventCard.id]),
        turnState: "IDLE"
      });

      await act(async () => {
        await result.current.handlePlayCard();
      });

      expect(mockPlayCardEvent).toHaveBeenCalledWith(eventCard);
      expect(toast.error).toHaveBeenCalledWith(
        "The player you selected doesn't meet the requirements to play this card"
      );
      expect(mockSetInventoryCards).not.toHaveBeenCalled();
      expect(mockSetSelectedCardIds).not.toHaveBeenCalled();
    });

    it("should show generic error toast if playCardEvent throws", async () => {
      const error = new Error("API Failed");
      mockPlayCardEvent.mockRejectedValue(error);
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const { result } = renderTestHook({
        inventoryCards: [eventCard],
        selectedCardIds: new Set([eventCard.id]),
        turnState: "IDLE"
      });

      await act(async () => {
        await result.current.handlePlayCard();
      });

      expect(mockPlayCardEvent).toHaveBeenCalledWith(eventCard);
      expect(toast.error).toHaveBeenCalledWith("The card could not be played");
      expect(consoleErrorSpy).toHaveBeenCalledWith(error.message);
      expect(mockSetInventoryCards).not.toHaveBeenCalled();
      expect(mockSetSelectedCardIds).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("Playing Single Detective Card", () => {
    const detectiveCard = {
      id: "d1",
      name: "Detective X",
      type: "DETECTIVE",
      description: "Detective card"
    };

    it("should call addDetective and update state on success", async () => {
      const mockAddDetective = vi.fn().mockResolvedValue(true);
      const mockDetectiveService = { addDetective: mockAddDetective };

      const { result } = renderHook(() =>
        UseCardPlay({
          cardActionsService: mockCardActionsService,
          cardDetectiveService: mockDetectiveService,
          inventoryCards: [detectiveCard],
          selectedCardIds: new Set([detectiveCard.id]),
          setInventoryCards: mockSetInventoryCards,
          setSelectedCardIds: mockSetSelectedCardIds,
          turnState: "IDLE"
        })
      );

      await act(async () => {
        await result.current.handlePlayCard();
      });

      expect(mockAddDetective).toHaveBeenCalledWith(detectiveCard);
      expect(mockSetSelectedCardIds).toHaveBeenCalledWith(new Set());
      expect(mockSetInventoryCards).toHaveBeenCalled();
    });

    it("should show error toast if addDetective returns null", async () => {
      const mockAddDetective = vi.fn().mockResolvedValue(null);
      const mockDetectiveService = { addDetective: mockAddDetective };

      const { result } = renderHook(() =>
        UseCardPlay({
          cardActionsService: mockCardActionsService,
          cardDetectiveService: mockDetectiveService,
          inventoryCards: [detectiveCard],
          selectedCardIds: new Set([detectiveCard.id]),
          setInventoryCards: mockSetInventoryCards,
          setSelectedCardIds: mockSetSelectedCardIds,
          turnState: "IDLE"
        })
      );

      await act(async () => {
        await result.current.handlePlayCard();
      });

      expect(mockAddDetective).toHaveBeenCalledWith(detectiveCard);
      expect(toast.error).toHaveBeenCalledWith(
        "Detective and set are not the same type."
      );
      expect(mockSetSelectedCardIds).not.toHaveBeenCalled();
      expect(mockSetInventoryCards).not.toHaveBeenCalled();
    });

    it("should throw an error if addDetective throws", async () => {
      const mockAddDetective = vi
        .fn()
        .mockRejectedValue(new Error("Add detective failed"));
      const mockDetectiveService = { addDetective: mockAddDetective };

      const { result } = renderHook(() =>
        UseCardPlay({
          cardActionsService: mockCardActionsService,
          cardDetectiveService: mockDetectiveService,
          inventoryCards: [detectiveCard],
          selectedCardIds: new Set([detectiveCard.id]),
          setInventoryCards: mockSetInventoryCards,
          setSelectedCardIds: mockSetSelectedCardIds,
          turnState: "IDLE"
        })
      );

      await expect(
        act(async () => {
          await result.current.handlePlayCard();
        })
      ).rejects.toThrow("Could not add detective.");

      expect(mockAddDetective).toHaveBeenCalledWith(detectiveCard);
    });
  });

  describe("Playing Multiple Cards", () => {
    it("should show error if multiple cards selected and not all are DETECTIVE", async () => {
      const eventCard = { id: "e1", name: "Sospecha", type: "EVENT" };
      const detectiveCard = { id: "d1", name: "Poirot", type: "DETECTIVE" };
      const { result } = renderTestHook({
        inventoryCards: [eventCard, detectiveCard],
        selectedCardIds: new Set([eventCard.id, detectiveCard.id]),
        turnState: "IDLE"
      });

      await act(async () => {
        await result.current.handlePlayCard();
      });

      expect(toast.error).toHaveBeenCalledWith(
        "If you play more than one card, they must all be Detective cards"
      );
      expect(mockPlayCardEvent).not.toHaveBeenCalled();
      expect(mockPlaySet).not.toHaveBeenCalled();
      expect(mockSetInventoryCards).not.toHaveBeenCalled();
      expect(mockSetSelectedCardIds).not.toHaveBeenCalled();
    });
  });

  describe("Playing Detective Set", () => {
    const detectiveCards = [
      { id: "d1", name: "Poirot", type: "DETECTIVE" },
      { id: "d2", name: "Marple", type: "DETECTIVE" }
    ];

    it("should call playSet and update state on success", async () => {
      mockPlaySet.mockResolvedValue({ success: true });
      const { result } = renderTestHook({
        inventoryCards: detectiveCards,
        selectedCardIds: new Set(detectiveCards.map(c => c.id)),
        turnState: "IDLE"
      });

      await act(async () => {
        await result.current.handlePlayCard();
      });

      expect(mockPlaySet).toHaveBeenCalledWith(detectiveCards);
      expect(toast.success).toHaveBeenCalledWith("the set was played");
      expect(mockSetInventoryCards).toHaveBeenCalled();
      expect(mockSetSelectedCardIds).toHaveBeenCalledWith(new Set());
    });

    it("should show specific error toast if playSet returns null", async () => {
      mockPlaySet.mockResolvedValue(null);
      const { result } = renderTestHook({
        inventoryCards: detectiveCards,
        selectedCardIds: new Set(detectiveCards.map(c => c.id)),
        turnState: "IDLE"
      });

      await act(async () => {
        await result.current.handlePlayCard();
      });

      expect(mockPlaySet).toHaveBeenCalledWith(detectiveCards);
      expect(toast.error).toHaveBeenCalledWith(
        "The player you selected has no secrets available"
      );
      expect(mockSetInventoryCards).not.toHaveBeenCalled();
      expect(mockSetSelectedCardIds).not.toHaveBeenCalled();
    });

    it("should show generic error toast if playSet throws", async () => {
      const error = new Error("Invalid Set");
      mockPlaySet.mockRejectedValue(error);
      const { result } = renderTestHook({
        inventoryCards: detectiveCards,
        selectedCardIds: new Set(detectiveCards.map(c => c.id)),
        turnState: "IDLE"
      });

      await act(async () => {
        await result.current.handlePlayCard();
      });

      expect(mockPlaySet).toHaveBeenCalledWith(detectiveCards);
      expect(toast.error).toHaveBeenCalledWith("Invalid Set");
      expect(mockSetInventoryCards).not.toHaveBeenCalled();
      expect(mockSetSelectedCardIds).not.toHaveBeenCalled();
    });
  });
});
