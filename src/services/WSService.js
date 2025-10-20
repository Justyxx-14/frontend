const createWSService = () => {
  let ws = null;
  let isConnected = false;
  let isConnecting = false;
  let shouldReconnect = true;
  const wsUrl = import.meta.env.VITE_WS_URI || "ws://localhost:8000/ws";
  const listeners = {};

  const emit = (event, data) => {
    if (listeners[event]) {
      listeners[event].forEach((callback) => callback(data));
    }
  };

  const connect = (gameId) => {
    const url = gameId ? `${wsUrl}/${gameId}` : wsUrl;
    try {
      ws = new WebSocket(url);

      ws.onopen = () => {
        isConnected = true;
        isConnecting = false;
        console.log("WebSocket connected");
        emit("open");
      };

      ws.onmessage = (event) => {
        try {
          console.log("WS message received:", event.data);
          const message = JSON.parse(event.data);
          const { type, data } = message;
          console.log("Parsed type:", type, "data:", data);

          if (listeners[type]) {
            listeners[type].forEach((callback) => callback(data));
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        isConnected = false;
        isConnecting = false;
        if (shouldReconnect) {
          setTimeout(() => connect(), 3000);
        }
      };

      ws.onerror = (error) => {
        isConnected = false;
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      isConnected = false;
      console.error("Failed to connect to WebSocket:", error);
    }
  };

  const on = (event, callback) => {
    if (!listeners[event]) {
      listeners[event] = [];
    }
    listeners[event].push(callback);
  };

  const off = (event, callback) => {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter((cb) => cb !== callback);
    }
  };

  const disconnect = () => {
    if (ws) {
      shouldReconnect = false;
      ws.close();
    }
  };

  return {
    isConnected,
    connect,
    on,
    off,
    disconnect,
  };
};

export { createWSService };
