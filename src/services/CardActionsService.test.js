import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createCardActionsService } from "./CardActionsService";

const mockHttpService = {
  playCardEvent: vi.fn(),
  getLastDiscardedCards: vi.fn(),
  getSecretsGame: vi.fn(),
  getSets: vi.fn(),
  getPlayerNeighbors: vi.fn(),
  getCardsByPlayer: vi.fn(),
  selectCardForPassing: vi.fn(),
  votePlayer: vi.fn(),
  revealSecretAction: vi.fn(),
  viewSecret: vi.fn()
};
const mockOpenSelectionModal = vi.fn();
const mockOpenZoomModal = vi.fn();

const gameId = "test-game-id";
const playerId = "player-1";
const currentPlayer = { id: playerId, name: "You" };
const otherPlayers = [
  { id: "player-2", name: "Alice" },
  { id: "player-3", name: "Bob" }
];

describe("CardActionsService", () => {
  let service;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOpenSelectionModal.mockImplementation(async config => {
      const mockSelection =
        config.items && config.items.length > 0
          ? config.items[0]
          : { id: "mock-selected-id" }; // Devuelve el objeto o ID

      // Simula que onSelect se llama después de un frame
      await Promise.resolve();
      // Devuelve el ID si el ítem tiene uno, o el ítem mismo
      config.onSelect(mockSelection.id || mockSelection);
    });

    service = createCardActionsService({
      httpService: mockHttpService,
      gameId,
      playerId,
      otherPlayers,
      openSelectionModal: mockOpenSelectionModal,
      openZoomModal: mockOpenZoomModal,
      currentPlayer
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("playCardEvent", () => {
    it("should call _playECOT for E_COT card", async () => {
      const card = { id: "c1", name: "E_COT", description: "Call of Truth" };
      mockHttpService.playCardEvent.mockResolvedValue({ success: true });
      // Simula que el usuario elige a 'player-2'
      mockOpenSelectionModal.mockImplementationOnce(async config =>
        config.onSelect("player-2")
      );

      await service.playCardEvent(card);

      expect(mockOpenSelectionModal).toHaveBeenCalledWith(
        expect.objectContaining({ itemType: "player", items: otherPlayers })
      );
      // Verifica que se llame con el objeto correcto
      expect(mockHttpService.playCardEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          gameId,
          eventId: card.id,
          playerId,
          targetPlayer: "player-2",
          eventCode: card.name
        })
      );
    });

    it("should call _playELIA for E_LIA card and select a card", async () => {
      const card = { id: "c2", name: "E_LIA", description: "Leave It All" };
      const discardedCards = [{ id: "dc1", name: "Discarded1" }];
      mockHttpService.getLastDiscardedCards.mockResolvedValue(discardedCards);
      mockOpenSelectionModal.mockImplementationOnce(async config =>
        config.onSelect("dc1")
      );
      mockHttpService.playCardEvent.mockResolvedValue({ success: true });

      await service.playCardEvent(card);

      expect(mockHttpService.getLastDiscardedCards).toHaveBeenCalledWith(
        gameId,
        5
      );
      expect(mockOpenSelectionModal).toHaveBeenCalledWith(
        expect.objectContaining({ itemType: "card", items: discardedCards })
      );
      expect(mockHttpService.playCardEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          gameId,
          eventId: card.id,
          playerId,
          cardId: "dc1",
          eventCode: card.name
        })
      );
    });

    it("should call _playEATWOM for E_ATWOM card with full flow", async () => {
      const card = {
        id: "c3",
        name: "E_ATWOM",
        description: "Attack Without Mercy"
      };
      const revealedSecrets = [{ id: "s1", name: "Secret1", revealed: true }];
      const allPlayers = [...otherPlayers, currentPlayer];

      mockOpenSelectionModal
        .mockImplementationOnce(async config => config.onSelect("player-2")) // 1. Elegir jugador de quien robar
        .mockImplementationOnce(async config => config.onSelect("s1")) // 2. Elegir secreto
        .mockImplementationOnce(async config => config.onSelect("player-3")); // 3. Elegir jugador a quien dar

      mockHttpService.getSecretsGame.mockResolvedValue(revealedSecrets);
      mockHttpService.playCardEvent.mockResolvedValue({ success: true });

      await service.playCardEvent(card);

      // Verifica las llamadas al modal
      expect(mockOpenSelectionModal).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ itemType: "player", items: otherPlayers })
      );
      expect(mockOpenSelectionModal).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ itemType: "secret", items: revealedSecrets })
      );
      expect(mockOpenSelectionModal).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({ itemType: "player", items: allPlayers })
      );

      expect(mockHttpService.playCardEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          gameId,
          eventId: card.id,
          playerId,
          targetPlayer: "player-3",
          secretId: "s1",
          eventCode: card.name
        })
      );
    });

    it("should call _playEAV: select set, player, THEN secret", async () => {
      const card = { id: "c4", name: "E_AV", description: "Allies Vanished" };
      const sets = [{ id: "set1", name: "SetP2", type: "PP" }]; // Tipo PP requiere secreto
      const targetSecrets = [
        { id: "s1", name: "TargetSecret", revealed: false }
      ];

      mockHttpService.getSets.mockResolvedValue(sets);
      mockHttpService.getSecretsGame.mockResolvedValue(targetSecrets);

      mockOpenSelectionModal
        .mockImplementationOnce(async config => config.onSelect("set1")) // 1. Elegir set
        .mockImplementationOnce(async config => config.onSelect("player-3")) // 2. Elegir jugador objetivo
        .mockImplementationOnce(async config => config.onSelect("s1")); // 3. Elegir secreto

      mockHttpService.playCardEvent.mockResolvedValue({ success: true });

      await service.playCardEvent(card);

      expect(mockOpenSelectionModal).toHaveBeenCalledTimes(3);
      expect(mockHttpService.getSets).toHaveBeenCalledTimes(
        otherPlayers.length
      );
      expect(mockHttpService.getSecretsGame).toHaveBeenCalledWith(
        gameId,
        "player-3"
      );
      expect(mockHttpService.playCardEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          gameId,
          eventId: card.id,
          playerId,
          targetPlayer: "player-3",
          secretId: "s1",
          setId: "set1",
          eventCode: card.name
        })
      );
    });

    it("should call _playEDCF for E_DCF card (2P game)", async () => {
      const card = { id: "c7", name: "E_DCF", description: "Direction Card" };
      const neighbors = [
        { direction: "left", name: "Prev" },
        { direction: "right", name: "Next" }
      ];
      mockHttpService.getPlayerNeighbors.mockResolvedValue({
        previous_player: neighbors[0],
        next_player: neighbors[1]
      });
      mockHttpService.playCardEvent.mockResolvedValue({ success: true });

      mockOpenSelectionModal.mockImplementationOnce(
        async config => config.onSelect(neighbors[1]) 
      );

      await service.playCardEvent(card);

      expect(mockHttpService.getPlayerNeighbors).toHaveBeenCalledWith(
        gameId,
        playerId
      );

      expect(mockHttpService.playCardEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          gameId,
          eventId: card.id,
          playerId,
          eventCode: card.name,
          direction: neighbors[1].direction
        })
      );
    });

    it("should call _playEDCF for E_DCF card (3P game)", async () => {
      const card = { id: "c7", name: "E_DCF", description: "Direction Card" };
      const neighbors = [
        { id: "p2-id", direction: "prev", name: "Prev" },
        { id: "p3-id", direction: "next", name: "Next" }
      ];
      mockHttpService.getPlayerNeighbors.mockResolvedValue({
        previous_player: neighbors[0],
        next_player: neighbors[1]
      });
      mockHttpService.playCardEvent.mockResolvedValue({ success: true });

      mockOpenSelectionModal.mockImplementationOnce(
        async config => config.onSelect(neighbors[1])
      );

      await service.playCardEvent(card);

      expect(mockHttpService.getPlayerNeighbors).toHaveBeenCalledWith(
        gameId,
        playerId
      );
      expect(mockOpenSelectionModal).toHaveBeenCalledWith(
        expect.objectContaining({
          itemType: "direction",
          items: neighbors
        })
      );
      expect(mockHttpService.playCardEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          gameId,
          eventId: card.id,
          playerId,
          eventCode: card.name,
          direction: neighbors[1].direction
        })
      );
    });

    it("should call _playNormal for E_PYS card", async () => {
      const card = {
        id: "c8",
        name: "E_PYS",
        description: "Point Your Suspicions"
      };
      mockHttpService.playCardEvent.mockResolvedValue({ success: true });

      await service.playCardEvent(card);

      expect(mockOpenSelectionModal).not.toHaveBeenCalled();
      expect(mockHttpService.playCardEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          gameId,
          eventId: card.id,
          playerId,
          eventCode: card.name
        })
      );
    });
  });

  describe("Other Service Functions", () => {
    it("should call callPassCard and select a card", async () => {
      const cards = [{ id: "card1" }, { id: "card2" }];
      mockHttpService.getCardsByPlayer.mockResolvedValue(cards);
      mockHttpService.selectCardForPassing.mockResolvedValue({ success: true });
      // Simula que el usuario elije 'card1'
      mockOpenSelectionModal.mockImplementationOnce(async config =>
        config.onSelect("card1")
      );

      const result = await service.callPassCard("left");

      expect(mockHttpService.getCardsByPlayer).toHaveBeenCalledWith(
        gameId,
        playerId
      );
      expect(mockOpenSelectionModal).toHaveBeenCalledWith(
        expect.objectContaining({
          itemType: "card",
          title: "Select a card to pass to the left",
          items: cards
        })
      );
      expect(mockHttpService.selectCardForPassing).toHaveBeenCalledWith({
        gameId: gameId,
        playerId: playerId,
        cardId: "card1"
      });
      expect(result).toEqual({ success: true });
    });

    it("should call callVotePlayer and select a player", async () => {
      mockHttpService.votePlayer.mockResolvedValue({ ok: true });
      mockOpenSelectionModal.mockImplementationOnce(async config =>
        config.onSelect("player-2")
      );

      await service.callVotePlayer();
      expect(mockOpenSelectionModal).toHaveBeenCalledWith(
        expect.objectContaining({
          itemType: "player",
          title: "Select a player to vote",
          items: otherPlayers
        })
      );
      expect(mockHttpService.votePlayer).toHaveBeenCalledWith(
        expect.objectContaining({
          gameId: gameId,
          playerId: playerId,
          targetPlayerId: "player-2"
        })
      );
    });

    it("should call callOtherSecrets and select a secret", async () => {
      const targetPlayerId = "player-2";
      const secrets = [{ id: "s1", name: "Secret1", revealed: false }];
      mockHttpService.getSecretsGame.mockResolvedValue(secrets);
      mockHttpService.revealSecretAction.mockResolvedValue({ ok: true });
      mockOpenSelectionModal.mockImplementationOnce(async config =>
        config.onSelect("s1")
      );

      await service.callOtherSecrets(targetPlayerId);

      expect(mockHttpService.getSecretsGame).toHaveBeenCalledWith(
        gameId,
        targetPlayerId
      );
      expect(mockOpenSelectionModal).toHaveBeenCalledWith(
        expect.objectContaining({
          itemType: "secret",
          title: "Select a secret you want to reveal",
          items: secrets,
          ownerId: targetPlayerId
        })
      );
      expect(mockHttpService.revealSecretAction).toHaveBeenCalledWith(
        expect.objectContaining({
          gameId: gameId,
          targetPlayerId: targetPlayerId,
          selectedSecretId: "s1"
        })
      );
    });
    
    it("should call _playENSF for E_NSF card", async () => {
      const card = { id: "c9", name: "E_NSF", description: "Not So Fast" };
      mockHttpService.playCardNSF = vi
        .fn()
        .mockResolvedValue({ success: true });

      await service.playCardEvent(card);

      expect(mockHttpService.playCardNSF).toHaveBeenCalledWith({
        gameId,
        eventId: card.id,
        playerId
      });
    });

    it("should call deviousSent and open modal with selected secret", async () => {
      const secrets = [
        { id: "s1", revealed: false },
        { id: "s2", revealed: true }
      ];

      const mockData = {
        target_player_id: "player-2"
      };

      const playerWhoRecived = "Alice";

      mockHttpService.getSecretsGame.mockResolvedValue(secrets);
      mockHttpService.viewSecret.mockResolvedValue({ id: "s1", name: "Secret1" });

      mockOpenSelectionModal.mockImplementationOnce(async config => {
        expect(config.title).toBe("Select a Alice's secret you want to see");
        expect(config.items).toEqual([{ id: "s1", revealed: false }]);
        await config.onSelect("s1");
      });

      await service.deviousSent(mockData, playerWhoRecived);

      expect(mockHttpService.getSecretsGame).toHaveBeenCalledWith(
        gameId,
        mockData.target_player_id
      );
      expect(mockHttpService.viewSecret).toHaveBeenCalledWith("s1");
      expect(mockOpenZoomModal).toHaveBeenCalledWith(
        "secrets",
        [{ id: "s1", name: "Secret1" }],
        "Alice's secret",
        true
      );
    });

    it("should handle errors gracefully in deviousSent", async () => {
      const mockError = new Error("API fail");
      mockHttpService.getSecretsGame.mockRejectedValue(mockError);
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      await service.deviousSent({ target_player_id: "player-2" }, "Alice");

      expect(consoleWarnSpy).toHaveBeenCalledWith(mockError);
      expect(mockHttpService.viewSecret).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});
