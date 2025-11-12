import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import React from "react";

const { mockRender, mockCreateRoot } = vi.hoisted(() => {
  const renderFn = vi.fn();
  return {
    mockRender: renderFn,
    mockCreateRoot: vi.fn(() => ({ render: renderFn }))
  };
});

vi.mock("react-dom/client", () => ({
  createRoot: mockCreateRoot
}));

vi.mock("./context/GameProvider.jsx", () => ({
  GameProvider: ({ children }) => (
    <div data-testid="game-provider">{children}</div>
  )
}));
vi.mock("./containers/Menu/Menu", () => ({
  default: () => <div data-testid="menu-page">Menu</div>
}));
vi.mock("./containers/Lobby/Lobby", () => ({
  default: () => <div data-testid="lobby-page">Lobby</div>
}));
vi.mock("./containers/InGame/InGame", () => ({
  default: () => <div data-testid="ingame-page">InGame</div>
}));
vi.mock("./containers/endGame/EndGame", () => ({
  default: () => <div data-testid="endgame-page">EndGame</div>
}));
vi.mock("./pages/NotFound", () => ({
  default: () => <div data-testid="notfound-page">NotFound</div>
}));
vi.mock("react-hot-toast", () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>
}));

describe("main.jsx", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="root"></div>';
  });

  it("should create root and render the main application structure", async () => {
    await import("./main.jsx");

    expect(mockCreateRoot).toHaveBeenCalledTimes(1);
    expect(mockCreateRoot).toHaveBeenCalledWith(
      document.getElementById("root")
    );

    expect(mockRender).toHaveBeenCalledTimes(1);

    const renderedContent = mockRender.mock.calls[0][0];
    expect(renderedContent.type).toBe(React.Fragment);
    const children = renderedContent.props.children;
    const childArray = Array.isArray(children) ? children : [children];
    expect(childArray.some(c => c && c.type === BrowserRouter)).toBe(true);
    expect(childArray.some(c => c && c.type === Toaster)).toBe(true);
  });
});
