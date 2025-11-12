import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { act } from "@testing-library/react";
import { createWSService } from "./WSService";

class MockWebSocket {
  static instances = [];
  url = "";
  readyState = 0;
  onopen = vi.fn();
  onmessage = vi.fn();
  onclose = vi.fn();
  onerror = vi.fn();
  close = vi.fn(() => {
    this.readyState = 3;
    setTimeout(() => this.onclose({ code: 1000, reason: "Normal closure" }), 0);
  });
  send = vi.fn();

  constructor(url) {
    this.url = url;
    MockWebSocket.instances.push(this);

    setTimeout(() => {
      this.readyState = 1;
      this.onopen();
    }, 10);
  }

  _simulateMessage(data) {
    const event = { data: JSON.stringify(data) };
    this.onmessage(event);
  }
  _simulateError(error = new Error("WebSocket Error")) {
    this.onerror(error);
  }
  _simulateClose(code = 1006, reason = "Abnormal closure", wasClean = false) {
    this.readyState = 3;
    this.onclose({ code, reason, wasClean });
  }
  _simulateJsonError() {
    const event = { data: "{invalid json" };
    this.onmessage(event);
  }
}

const originalWebSocket = global.WebSocket;

beforeEach(() => {
  MockWebSocket.instances = [];
  global.WebSocket = MockWebSocket;
  vi.useFakeTimers();
});

afterEach(() => {
  global.WebSocket = originalWebSocket;
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("createWSService", () => {
  const wsUrl = "ws://localhost:8000/ws";

  it("should create a service instance", () => {
    const service = createWSService();
    expect(service).toBeDefined();
    expect(service.connect).toBeInstanceOf(Function);
    expect(service.on).toBeInstanceOf(Function);
    expect(service.off).toBeInstanceOf(Function);
    expect(service.disconnect).toBeInstanceOf(Function);
  });

  describe("connect", () => {
    it("should create WebSocket with correct URL (no gameId)", () => {
      const service = createWSService();
      service.connect();
      expect(MockWebSocket.instances.length).toBe(1);
      expect(MockWebSocket.instances[0].url).toBe(wsUrl);
    });

    it("should create WebSocket with correct URL (with gameId)", () => {
      const service = createWSService();
      const gameId = "game-abc";
      service.connect(gameId);
      expect(MockWebSocket.instances.length).toBe(1);
      expect(MockWebSocket.instances[0].url).toBe(`${wsUrl}/${gameId}`);
    });

    it("should set isConnected and emit 'open' on successful connection", async () => {
      const service = createWSService();
      const openListener = vi.fn();
      service.on("open", openListener);
      service.connect();

      await act(async () => {
        vi.advanceTimersByTime(20);
      });

      expect(openListener).toHaveBeenCalledTimes(1);
    });

    it("should attempt to reconnect on close if shouldReconnect is true", async () => {
      const service = createWSService();
      service.connect("game1");
      await act(async () => {
        vi.advanceTimersByTime(20);
      });

      expect(MockWebSocket.instances.length).toBe(1);
      const wsInstance = MockWebSocket.instances[0];

      await act(async () => {
        wsInstance._simulateClose();
      });

      await act(async () => {
        vi.advanceTimersByTime(3010);
      });

      expect(MockWebSocket.instances.length).toBe(2);
      expect(MockWebSocket.instances[1].url).toBe(wsInstance.url);
    });

    it("should NOT reconnect on close if disconnect was called", async () => {
      const service = createWSService();
      service.connect("game1");
      await act(async () => {
        vi.advanceTimersByTime(20);
      });
      expect(MockWebSocket.instances.length).toBe(1);
      const wsInstance = MockWebSocket.instances[0];

      service.disconnect();

      await act(async () => {
        vi.advanceTimersByTime(10);
      });

      await act(async () => {
        vi.advanceTimersByTime(3010);
      });

      expect(MockWebSocket.instances.length).toBe(1);
    });

    it("should handle WebSocket errors", async () => {
      const service = createWSService();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      service.connect();
      await act(async () => {
        vi.advanceTimersByTime(20);
      });
      const wsInstance = MockWebSocket.instances[0];
      const error = new Error("Connection failed");
      await act(async () => {
        wsInstance._simulateError(error);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith("WebSocket error:", error);
      consoleErrorSpy.mockRestore();
    });

    it("should handle connection initialization errors", async () => {
      const service = createWSService();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      global.WebSocket = vi.fn(() => {
        throw new Error("Connection refused");
      });

      service.connect();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to connect to WebSocket:",
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
      global.WebSocket = MockWebSocket;
    });
  });

  describe("on / off / message handling", () => {
    it("should register and trigger listeners on message", async () => {
      const service = createWSService();
      const listenerA = vi.fn();
      const listenerB = vi.fn();
      const messageData = { field: "value" };
      const eventType = "customEvent";

      service.on(eventType, listenerA);
      service.on(eventType, listenerB);
      service.connect();
      await act(async () => {
        vi.advanceTimersByTime(20);
      });

      const wsInstance = MockWebSocket.instances[0];
      await act(async () => {
        wsInstance._simulateMessage({ type: eventType, data: messageData });
      });

      expect(listenerA).toHaveBeenCalledTimes(1);
      expect(listenerA).toHaveBeenCalledWith(messageData);
      expect(listenerB).toHaveBeenCalledTimes(1);
      expect(listenerB).toHaveBeenCalledWith(messageData);
    });

    it("should handle JSON parsing errors gracefully", async () => {
      const service = createWSService();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const listener = vi.fn();
      service.on("anyEvent", listener);
      service.connect();
      await act(async () => {
        vi.advanceTimersByTime(20);
      });

      const wsInstance = MockWebSocket.instances[0];
      await act(async () => {
        wsInstance._simulateJsonError();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error parsing WebSocket message:",
        expect.any(Error)
      );
      expect(listener).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("should only trigger listeners for the correct event type", async () => {
      const service = createWSService();
      const listenerA = vi.fn();
      const listenerB = vi.fn();
      service.on("eventA", listenerA);
      service.on("eventB", listenerB);
      service.connect();
      await act(async () => {
        vi.advanceTimersByTime(20);
      });

      const wsInstance = MockWebSocket.instances[0];
      await act(async () => {
        wsInstance._simulateMessage({ type: "eventA", data: { val: 1 } });
      });

      expect(listenerA).toHaveBeenCalledTimes(1);
      expect(listenerA).toHaveBeenCalledWith({ val: 1 });
      expect(listenerB).not.toHaveBeenCalled();
    });

    it("should unregister listeners with off", async () => {
      const service = createWSService();
      const listenerA = vi.fn();
      const listenerB = vi.fn();
      const eventType = "customEvent";
      service.on(eventType, listenerA);
      service.on(eventType, listenerB);
      service.connect();
      await act(async () => {
        vi.advanceTimersByTime(20);
      });

      service.off(eventType, listenerA);

      const wsInstance = MockWebSocket.instances[0];
      await act(async () => {
        wsInstance._simulateMessage({ type: eventType, data: { val: 2 } });
      });

      expect(listenerA).not.toHaveBeenCalled();
      expect(listenerB).toHaveBeenCalledTimes(1);
      expect(listenerB).toHaveBeenCalledWith({ val: 2 });
    });

    it("off should not affect other event types", async () => {
      const service = createWSService();
      const listenerA = vi.fn();
      const listenerOther = vi.fn();
      service.on("eventA", listenerA);
      service.on("otherEvent", listenerOther);
      service.connect();
      await act(async () => {
        vi.advanceTimersByTime(20);
      });

      service.off("eventA", listenerA);

      const wsInstance = MockWebSocket.instances[0];
      await act(async () => {
        wsInstance._simulateMessage({ type: "otherEvent", data: { val: 3 } });
      });

      expect(listenerA).not.toHaveBeenCalled();
      expect(listenerOther).toHaveBeenCalledTimes(1);
    });
  });

  describe("disconnect", () => {
    it("should call ws.close() if connected", async () => {
      const service = createWSService();
      service.connect();
      await act(async () => {
        vi.advanceTimersByTime(20);
      });

      expect(MockWebSocket.instances.length).toBe(1);
      const wsInstance = MockWebSocket.instances[0];
      const closeSpy = vi.spyOn(wsInstance, "close");

      service.disconnect();

      expect(closeSpy).toHaveBeenCalledTimes(1);
    });

    it("should not throw if called when not connected", () => {
      const service = createWSService();

      expect(() => service.disconnect()).not.toThrow();
      expect(MockWebSocket.instances.length).toBe(0);
    });
  });
});
