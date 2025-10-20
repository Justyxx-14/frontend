import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PlayerLayout from "./PlayerLayout";

// Mock child components
vi.mock("./SecretButton", () => ({
  default: ({ onClick }) => <button onClick={onClick}>Secrets</button>,
}));

vi.mock("./SetsButton", () => ({
  default: ({ onClick }) => <button onClick={onClick}>Sets</button>,
}));

vi.mock("framer-motion", async () => {
  const React = await import("react");
  return {
    motion: {
      div: React.forwardRef(({ children, ...props }, ref) => (
        <div {...props} ref={ref}>
          {children}
        </div>
      )),
    },
  };
});

describe("PlayerLayout Component", () => {
  const mockOnSecretButtonClick = vi.fn();
  const mockOnSetsButtonClick = vi.fn();

  const defaultProps = {
    player: { name: "Alice" },
    isCurrentTurn: false,
    i: 0,
    totalPlayers: 3,
    onSecretButtonClick: mockOnSecretButtonClick,
    onSetsButtonClick: mockOnSetsButtonClick,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the player's name and avatar correctly", () => {
    render(<PlayerLayout {...defaultProps} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();

    const avatar = screen.getByAltText("Avatar");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute("src", "/avatar.webp");
  });

  it("applies a special shadow style when it is the current player's turn", () => {
    const { container } = render(
      <PlayerLayout
        player={{ name: "Player C", cards: 2 }}
        isCurrentTurn={true}
        i={0}
        totalPlayers={3}
        onSecretButtonClick={vi.fn()}
      />
    );

    const avatarWrapper = container.querySelector("div.rounded-full");
    expect(avatarWrapper).toHaveClass("shadow-[0_0_25px_5px_gold]");
  });

  it("does not apply the special shadow style when it is not the current player's turn", () => {
    const { container } = render(<PlayerLayout {...defaultProps} />);
    const avatarWrapper = container.querySelector("div.rounded-full");
    expect(avatarWrapper).not.toHaveClass("shadow-[0_0_25px_5px_gold]");
  });

  it("calls the onSecretButtonClick handler when the secrets button is clicked", () => {
    render(<PlayerLayout {...defaultProps} />);

    const secretsButton = screen.getByRole("button", { name: "Secrets" });
    fireEvent.click(secretsButton);

    expect(mockOnSecretButtonClick).toHaveBeenCalledTimes(1);
  });

  it("calls the onSecretButtonClick handler when the secrets button is clicked", () => {
    render(<PlayerLayout {...defaultProps} />);

    const setsButton = screen.getByRole("button", { name: "Sets" });
    fireEvent.click(setsButton);

    expect(mockOnSetsButtonClick).toHaveBeenCalledTimes(1);
  });
});
