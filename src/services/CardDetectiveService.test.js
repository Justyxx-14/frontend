import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCardDetectiveService } from "./CardDetectiveService";

const mockHttpService = {
  getSecretsGame: vi.fn(),
  setsElectionSecret: vi.fn(),
  verifySetDetective: vi.fn(),
  playDetectiveEffect: vi.fn(),
  addDetectiveEffect: vi.fn(),
  addAriadne: vi.fn(),
  getSets: vi.fn()
};
const mockOpenSelectionModal = vi.fn();

const gameId = "test-game-id";
const playerId = "player-1";
const otherPlayers = [
  { id: "player-2", name: "Alice" },
  { id: "player-3", name: "Bob" }
];
const detectiveCards = [
  { id: "d1", name: "Poirot" },
  { id: "d2", name: "Marple" }
];
const cardIds = detectiveCards.map(c => c.id);

describe("CardDetectiveService", () => {
  let service;

  beforeEach(() => {
    vi.clearAllMocks();

    mockOpenSelectionModal.mockImplementation(async config => {
      const mockSelection =
        config.items && config.items.length > 0
          ? config.items[0].id
          : "mock-selected-id";
      await Promise.resolve();
      config.onSelect(mockSelection);
    });

    service = createCardDetectiveService({
      httpService: mockHttpService,
      gameId,
      playerId,
      otherPlayers,
      openSelectionModal: mockOpenSelectionModal
    });
  });

  describe("callOtherSecrets", () => {
    it("should prompt for secret and call API if target has unrevealed secrets", async () => {
      const targetPlayerId = "player-2";
      const setId = "set-123";
      const secrets = [
        { id: "s1", name: "Secret 1", revealed: false },
        { id: "s2", name: "Secret 2", revealed: true }
      ];
      const expectedSecretToChoose = secrets[0];

      mockHttpService.getSecretsGame.mockResolvedValue(secrets);
      mockOpenSelectionModal.mockImplementationOnce(async config => {
        await Promise.resolve();
        config.onSelect(expectedSecretToChoose.id);
      });
      mockHttpService.setsElectionSecret.mockResolvedValue({ success: true });

      await service.callOtherSecrets(setId, targetPlayerId);

      expect(mockHttpService.getSecretsGame).toHaveBeenCalledWith(
        gameId,
        targetPlayerId
      );
      expect(mockOpenSelectionModal).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Select a secret you want to reveal",
          items: [expectedSecretToChoose],
          itemType: "secret",
          ownerId: targetPlayerId
        })
      );
      expect(mockHttpService.setsElectionSecret).toHaveBeenCalledWith(gameId, {
        setId: setId,
        targetPlayerId: targetPlayerId,
        selectedSecretId: expectedSecretToChoose.id
      });
    });

    it("should return null if target has no unrevealed secrets", async () => {
      const targetPlayerId = "player-2";
      const setId = "set-123";
      const secrets = [{ id: "s2", name: "Secret 2", revealed: true }];

      mockHttpService.getSecretsGame.mockResolvedValue(secrets);

      const result = await service.callOtherSecrets(setId, targetPlayerId);

      expect(mockHttpService.getSecretsGame).toHaveBeenCalledWith(
        gameId,
        targetPlayerId
      );
      expect(mockOpenSelectionModal).not.toHaveBeenCalled();
      expect(mockHttpService.setsElectionSecret).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("should return null if httpService.getSecretsGame fails or returns null/empty", async () => {
      const targetPlayerId = "player-2";
      const setId = "set-123";

      mockHttpService.getSecretsGame.mockResolvedValueOnce([]);
      let result = await service.callOtherSecrets(setId, targetPlayerId);
      expect(result).toBeNull();
      expect(mockOpenSelectionModal).not.toHaveBeenCalled();
      expect(mockHttpService.setsElectionSecret).not.toHaveBeenCalled();

      vi.clearAllMocks();

      mockHttpService.getSecretsGame.mockRejectedValueOnce(
        new Error("API Error")
      );
      await expect(
        service.callOtherSecrets(setId, targetPlayerId)
      ).rejects.toThrow("API Error");
      expect(mockOpenSelectionModal).not.toHaveBeenCalled();
      expect(mockHttpService.setsElectionSecret).not.toHaveBeenCalled();
    });
  });

  describe("playSet", () => {
    it("should throw error if verification fails", async () => {
      mockHttpService.verifySetDetective.mockResolvedValue(null);

      await expect(service.playSet(detectiveCards)).rejects.toThrow(
        "The detective set is invalid"
      );
      expect(mockHttpService.verifySetDetective).toHaveBeenCalledWith(
        detectiveCards
      );
      expect(mockOpenSelectionModal).not.toHaveBeenCalled();
      expect(mockHttpService.playDetectiveEffect).not.toHaveBeenCalled();
    });

    it("should call _effectChooseOtherPlayer for applicable set types ", async () => {
      const setType = "TB";
      mockHttpService.verifySetDetective.mockResolvedValue(setType);
      mockOpenSelectionModal.mockImplementationOnce(async config => {
        await Promise.resolve();
        config.onSelect("player-2");
      });
      mockHttpService.playDetectiveEffect.mockResolvedValue({ success: true });

      await service.playSet(detectiveCards);

      expect(mockHttpService.verifySetDetective).toHaveBeenCalledWith(
        detectiveCards
      );
      expect(mockOpenSelectionModal).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Select a player",
          itemType: "player"
        })
      );
      expect(mockHttpService.playDetectiveEffect).toHaveBeenCalledWith(
        gameId,
        cardIds,
        playerId,
        { target_player: "player-2" }
      );
    });

    it("should call _effectChooseOtherSecret (isPyne=false) for applicable set types", async () => {
      const setType = "MM";
      const secrets = [{ id: "s1", name: "Unrevealed", revealed: false }];
      mockHttpService.verifySetDetective.mockResolvedValue(setType);
      mockHttpService.getSecretsGame.mockResolvedValue(secrets);
      mockOpenSelectionModal
        .mockImplementationOnce(async config => {
          await Promise.resolve();
          config.onSelect("player-2");
        })
        .mockImplementationOnce(async config => {
          await Promise.resolve();
          config.onSelect("s1");
        });
      mockHttpService.playDetectiveEffect.mockResolvedValue({ success: true });

      await service.playSet(detectiveCards);

      expect(mockHttpService.verifySetDetective).toHaveBeenCalledWith(
        detectiveCards
      );
      expect(mockOpenSelectionModal).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          title: "Select a player",
          itemType: "player"
        })
      );
      expect(mockHttpService.getSecretsGame).toHaveBeenCalledWith(
        gameId,
        "player-2"
      );
      expect(mockOpenSelectionModal).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          title: expect.stringContaining("reveal"),
          items: secrets,
          itemType: "secret",
          ownerId: "player-2"
        })
      );
      expect(mockHttpService.playDetectiveEffect).toHaveBeenCalledWith(
        gameId,
        cardIds,
        playerId,
        { target_player: "player-2", target_secret: "s1" }
      );
    });

    it("should call _effectChooseOtherSecret (isPyne=true) for applicable set types", async () => {
      const setType = "PP";
      const secrets = [{ id: "s1", name: "Revealed", revealed: true }];
      mockHttpService.verifySetDetective.mockResolvedValue(setType);
      mockHttpService.getSecretsGame.mockResolvedValue(secrets);
      mockOpenSelectionModal
        .mockImplementationOnce(async config => {
          await Promise.resolve();
          config.onSelect("player-2");
        })
        .mockImplementationOnce(async config => {
          await Promise.resolve();
          config.onSelect("s1");
        });
      mockHttpService.playDetectiveEffect.mockResolvedValue({ success: true });

      await service.playSet(detectiveCards);

      expect(mockHttpService.verifySetDetective).toHaveBeenCalledWith(
        detectiveCards
      );
      expect(mockOpenSelectionModal).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          title: "Select a player",
          itemType: "player"
        })
      );
      expect(mockHttpService.getSecretsGame).toHaveBeenCalledWith(
        gameId,
        "player-2"
      );
      expect(mockOpenSelectionModal).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          title: expect.stringContaining("hide"),
          items: secrets,
          itemType: "secret",
          ownerId: "player-2"
        })
      );
      expect(mockHttpService.playDetectiveEffect).toHaveBeenCalledWith(
        gameId,
        cardIds,
        playerId,
        { target_player: "player-2", target_secret: "s1" }
      );
    });

    it("should return null from _effectChooseOtherSecret if target has no eligible secrets", async () => {
      const setType = "MM";
      const secrets = [{ id: "s1", name: "Revealed", revealed: true }];
      mockHttpService.verifySetDetective.mockResolvedValue(setType);
      mockHttpService.getSecretsGame.mockResolvedValue(secrets);
      mockOpenSelectionModal.mockImplementationOnce(async config => {
        await Promise.resolve();
        config.onSelect("player-2");
      });

      const result = await service.playSet(detectiveCards);

      expect(mockHttpService.verifySetDetective).toHaveBeenCalledWith(
        detectiveCards
      );
      expect(mockOpenSelectionModal).toHaveBeenCalledTimes(1);
      expect(mockHttpService.getSecretsGame).toHaveBeenCalledWith(
        gameId,
        "player-2"
      );
      expect(mockHttpService.playDetectiveEffect).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it("should throw error for unknown set type", async () => {
      const setType = "UNKNOWN_TYPE";
      mockHttpService.verifySetDetective.mockResolvedValue(setType);

      await expect(service.playSet(detectiveCards)).rejects.toThrow(
        `The effect for the “${setType}” set is undefined`
      );
      expect(mockHttpService.verifySetDetective).toHaveBeenCalledWith(
        detectiveCards
      );
      expect(mockOpenSelectionModal).not.toHaveBeenCalled();
      expect(mockHttpService.playDetectiveEffect).not.toHaveBeenCalled();
    });
  });
  
  describe("addDetective", () => {
    it("should call _effectChooseOtherSecret when adding a detective to an MM-type set", async () => {
      //test para flujo de añadir detective a un set con efecto de elegir el jugador que debe revelar el secreto
      const detective = { id: "d3", name: "D_MM" };
      const sets = [{ id: "set-123", name: "Set MM" }];
      const setInfo = [{ id: "set-123", type: "MM" }];
      const secrets = [{ id: "s1", name: "Secret 1", revealed: false }];

      mockHttpService.getSets
        .mockResolvedValueOnce(sets)
        .mockResolvedValueOnce(setInfo);
      mockOpenSelectionModal
        .mockImplementationOnce(async config => {
          await Promise.resolve();
          config.onSelect("set-123");
        })
        .mockImplementationOnce(async config => {
          await Promise.resolve();
          config.onSelect("player-2");
        })
        .mockImplementationOnce(async config => {
          await Promise.resolve();
          config.onSelect("s1");
        });

      mockHttpService.getSecretsGame.mockResolvedValue(secrets);
      mockHttpService.addDetectiveEffect = vi.fn().mockResolvedValue({ success: true });

      await service.addDetective(detective);

      expect(mockHttpService.getSets).toHaveBeenNthCalledWith(1, gameId, playerId, null);
      expect(mockHttpService.getSets).toHaveBeenNthCalledWith(2, gameId, playerId, "set-123");
      expect(mockOpenSelectionModal).toHaveBeenCalledTimes(3);
      expect(mockHttpService.getSecretsGame).toHaveBeenCalledWith(gameId, "player-2");
      expect(mockHttpService.addDetectiveEffect).toHaveBeenCalledWith(
        gameId,
        detective.id,
        playerId,
        {
          target_player: "player-2",
          target_secret: "s1",
          set_id: "set-123"
        }
      );
    });

    it("should call _effectChooseOtherPlayer for matching set type (TB)", async () => {
      //test para flujo de añadir detective a un set con efecto de elegir secreto a revelar
      const detective = { id: "d4", name: "D_TB" };
      const sets = [{ id: "set-999", name: "Set TB" }];
      const setInfo = [{ id: "set-999", type: "TB" }];

      mockHttpService.getSets
        .mockResolvedValueOnce(sets)
        .mockResolvedValueOnce(setInfo);

      mockOpenSelectionModal
        .mockImplementationOnce(async config => {
          await Promise.resolve();
          config.onSelect("set-999");
        })
        .mockImplementationOnce(async config => {
          await Promise.resolve();
          config.onSelect("player-2");
        });

      mockHttpService.addDetectiveEffect = vi.fn().mockResolvedValue({ success: true });

      await service.addDetective(detective);

      expect(mockHttpService.getSets).toHaveBeenNthCalledWith(1, gameId, playerId, null);
      expect(mockHttpService.getSets).toHaveBeenNthCalledWith(2, gameId, playerId, "set-999");
      expect(mockOpenSelectionModal).toHaveBeenCalledTimes(2);
      expect(mockHttpService.addDetectiveEffect).toHaveBeenCalledWith(
        gameId,
        detective.id,
        playerId,
        expect.objectContaining({
          set_id: "set-999",
          target_player: "player-2"
        })
      );
    });

    it("should handle adding AO detective (Ariadne flow) correctly", async () => {
      //test para flujo de añadir detective a un set con efecto de elegir secreto a revelar
      const detective = { id: "d4", name: "D_AO" };
      const setInfo = [{ id: "set-999", type: "TB" }];

      mockOpenSelectionModal
        .mockImplementationOnce(async config => {
          await Promise.resolve();
          config.onSelect("player-2");
        })
        .mockImplementationOnce(async config => {
          await Promise.resolve();
          config.onSelect("set-999");
        });

      mockHttpService.getSets
        .mockResolvedValueOnce(setInfo);

      mockHttpService.addAriadne = vi.fn().mockResolvedValue({ success: true });

      await service.addDetective(detective);

      expect(mockHttpService.getSets).toHaveBeenNthCalledWith(1, gameId, "player-2", null);
      expect(mockOpenSelectionModal).toHaveBeenCalledTimes(2);
      expect(mockHttpService.addAriadne).toHaveBeenCalledWith(
        gameId,
        "set-999",
        "player-1",
        detective.id
      );
    });
  });
});
