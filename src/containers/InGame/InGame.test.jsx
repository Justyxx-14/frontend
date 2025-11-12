import {
  render,
  screen,
  fireEvent,
  waitFor,
  within
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InGame from "./InGame";
import { useGame } from "@/context/useGame";
import { createHttpService } from "@/services/HttpService";
import { createWSService } from "@/services/WSService";
import { createCardActionsService } from "@/services/CardActionsService";
import { createCardDetectiveService } from "@/services/CardDetectiveService";
import toast from "react-hot-toast";

vi.mock("@/context/useGame");
vi.mock("@/services/HttpService");
vi.mock("@/services/WSService");
vi.mock("@/services/CardActionsService");
vi.mock("@/services/CardDetectiveService");
vi.mock("react-hot-toast");
vi.mock("react-router-dom", () => ({
  useParams: () => ({ gameId: "test-game-id" }),
  useNavigate: () => vi.fn()
}));

describe("InGame Component Extended Tests", () => {
  const mockCardsByPlayerContext = vi.fn();
  const mockGetDraftCards = vi.fn();
  const mockDrawDraftCard = vi.fn();
  const mockGetSecretsGame = vi.fn();
  const mockDiscardCardsContext = vi.fn();
  const mockPlayCardEvent = vi.fn();
  const mockPlaySet = vi.fn();
  const mockNextTurnGame = vi.fn();

  const mockTurnState = state => {
    vi.mocked(createHttpService).mockReturnValue({
      getDraftCards: mockGetDraftCards,
      drawDraftCard: mockDrawDraftCard,
      getSecretsGame: mockGetSecretsGame,
      getLastDiscardedCards: vi.fn().mockResolvedValue([]),
      regularDrawCards: vi.fn(),
      nextTurnGame: mockNextTurnGame,
      getTurnGame: vi.fn().mockResolvedValue({
        current_turn: "player-1",
        turn_state: state,
        target_player_id: null
      })
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useGame).mockReturnValue({
      currentGame: { id: "test-game-id" },
      idPlayer: "player-1",
      discardCardsContext: mockDiscardCardsContext,
      cardsByPlayerContext: mockCardsByPlayerContext,
      dataPlayers: { "player-1": "You", "player-2": "Alice" }
    });

    vi.mocked(createWSService).mockReturnValue({
      on: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn()
    });

    vi.mocked(createCardActionsService).mockReturnValue({
      playCardEvent: mockPlayCardEvent
    });

    vi.mocked(createCardDetectiveService).mockReturnValue({
      playSet: mockPlaySet,
      callOtherSecrets: vi.fn()
    });
  });

  it("renders initial hand and secrets correctly", async () => {
    mockTurnState("IDLE");

    const hand = [{ id: "h1", name: "HAND_CARD" }];
    const secrets = [{ id: "s1", name: "SECRET_CARD", revealed: true }];

    mockCardsByPlayerContext.mockResolvedValue(hand);
    mockGetDraftCards.mockResolvedValue([]);
    mockGetSecretsGame.mockResolvedValue(secrets);

    render(<InGame />);

    await screen.findByAltText("HAND_CARD");

    expect(mockCardsByPlayerContext).toHaveBeenCalledWith(
      "test-game-id",
      "player-1"
    );
    expect(mockGetSecretsGame).toHaveBeenCalledWith("test-game-id", "player-1");
  });

  it("opens CardZoomModal with hand cards", async () => {
    mockTurnState("IDLE");

    mockCardsByPlayerContext.mockResolvedValue([
      { id: "h1", name: "HAND_CARD" }
    ]);
    mockGetDraftCards.mockResolvedValue([]);
    mockGetSecretsGame.mockResolvedValue([]);

    render(<InGame />);

    await screen.findByAltText("HAND_CARD");

    const zoomButton = await screen.findByTestId("zoom-button");
    fireEvent.click(zoomButton);

    const modal = await screen.findByRole("dialog", {
      name: /Card zoom modal/i
    });
    expect(within(modal).getByAltText("HAND_CARD")).toBeInTheDocument();
  });

  it("opens CardZoomModal with own secrets", async () => {
    mockTurnState("IDLE");

    mockCardsByPlayerContext.mockResolvedValue([
      { id: "h1", name: "HAND_CARD" }
    ]);
    mockGetDraftCards.mockResolvedValue([]);
    mockGetSecretsGame.mockResolvedValue([
      { id: "s1", name: "SECRET_CARD", revealed: true }
    ]);

    render(<InGame />);
    await screen.findByAltText("HAND_CARD");

    const playerSection = screen
      .getByText(/\(You\)/i)
      .closest("div").nextSibling;
    const secretButton = within(playerSection).getByTestId("secret-button");
    fireEvent.click(secretButton);

    const modal = await screen.findByRole("dialog", {
      name: /Card zoom modal/i
    });
    expect(within(modal).getByAltText("SECRET_CARD")).toBeInTheDocument();
  });

  it("handles targetPlayerElection WS event correctly", async () => {
    mockTurnState("CHOOSING_SECRET");
    const callOtherSecretsMock = vi.fn().mockResolvedValue(true);
    vi.mocked(createCardDetectiveService).mockReturnValue({
      callOtherSecrets: callOtherSecretsMock
    });

    const onMock = vi.fn((event, callback) => {
      if (event === "targetPlayerElection") {
        callback({ target_player: "player-1", set_id: "set-1" });
      }
    });
    vi.mocked(createWSService).mockReturnValue({
      on: onMock,
      connect: vi.fn(),
      disconnect: vi.fn()
    });

    render(<InGame />);

    await waitFor(() => {
      expect(callOtherSecretsMock).toHaveBeenCalledWith("set-1", "player-1");
      expect(toast.success).toHaveBeenCalledWith("Your secret was revealed");
    });
  });

  it("discards a card during action phase", async () => {
    mockTurnState("IDLE");
    mockCardsByPlayerContext.mockResolvedValue([
      { id: "c1", name: "CARD_TO_DISCARD" }
    ]);
    mockGetDraftCards.mockResolvedValue([]);
    mockGetSecretsGame.mockResolvedValue([]);

    render(<InGame />);

    const card = await screen.findByAltText("CARD_TO_DISCARD");
    fireEvent.click(card);

    const discardButton = screen.getByRole("button", { name: /Discard/i });
    discardButton.removeAttribute("disabled");
    fireEvent.click(discardButton);

    await waitFor(() => {
      expect(mockDiscardCardsContext).toHaveBeenCalled();
      const callArgs = mockDiscardCardsContext.mock.calls[0];
      expect(callArgs[0]).toBe("test-game-id");
      expect(callArgs[1]).toBe("player-1");
      expect(callArgs[2]).toEqual(["c1"]);
    });
  });

  it("prevents discarding after drawing", async () => {
    mockTurnState("DRAWING_CARDS");
    mockCardsByPlayerContext.mockResolvedValue([
      { id: "c1", name: "CARD_TO_DISCARD" }
    ]);
    mockGetDraftCards.mockResolvedValue([]);
    mockGetSecretsGame.mockResolvedValue([]);

    render(<InGame />);

    const card = await screen.findByAltText("CARD_TO_DISCARD");
    fireEvent.click(card);

    const discardButton = screen.getByRole("button", { name: /Discard/i });
    discardButton.removeAttribute("disabled");
    fireEvent.click(discardButton);

    await waitFor(() => {
      expect(mockDiscardCardsContext).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(
        "You can't discard after drawing"
      );
    });
  });

  it("plays a set of DETECTIVE cards", async () => {
    mockTurnState("IDLE");

    const detectiveCards = [
      { id: "d1", name: "HerculePoirot", type: "DETECTIVE" },
      { id: "d2", name: "MissMarple", type: "DETECTIVE" }
    ];
    mockCardsByPlayerContext.mockResolvedValue(detectiveCards);
    mockGetDraftCards.mockResolvedValue([]);
    mockGetSecretsGame.mockResolvedValue([]);
    mockPlaySet.mockResolvedValue({ success: true });

    render(<InGame />);

    const card1 = await screen.findByAltText("HerculePoirot");
    const card2 = await screen.findByAltText("MissMarple");
    fireEvent.click(card1);
    fireEvent.click(card2);

    const playButton = screen.getByText("Play");
    playButton.removeAttribute("disabled");
    fireEvent.click(playButton);

    await waitFor(() => {
      expect(mockPlaySet).toHaveBeenCalledWith(detectiveCards);
      expect(toast.success).toHaveBeenCalledWith("the set was played");
    });
  });
});
