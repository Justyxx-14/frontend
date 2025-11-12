import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import CardZoomModal from "./CardZoomModal";

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const forwardRef = Component =>
    React.forwardRef(({ children, ...props }, ref) => (
      <Component {...props} ref={ref}>
        {children}
      </Component>
    ));

  return {
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: {
      div: forwardRef("div"),
      img: forwardRef("img"),
      h2: forwardRef("h2")
    }
  };
});

describe("CardZoomModal", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <CardZoomModal isOpen={false} onClose={mockOnClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders hand cards ('cards' type) with their front visible", () => {
    const handCards = [{ name: "Hand Card 1" }, { name: "Hand Card 2" }];
    render(
      <CardZoomModal
        isOpen={true}
        onClose={mockOnClose}
        cards={handCards}
        modalType="cards"
      />
    );

    expect(screen.getByAltText("Hand Card 1")).toBeInTheDocument();
    expect(screen.getByAltText("Hand Card 2")).toBeInTheDocument();
  });

  it("renders own secrets ('secrets' type) with their front visible", () => {
    const ownSecrets = [{ name: "My Secret", revealed: false }];
    render(
      <CardZoomModal
        isOpen={true}
        onClose={mockOnClose}
        cards={ownSecrets}
        modalType="secrets"
        viewingOwnSecrets={true}
      />
    );

    expect(screen.getByAltText("My Secret")).toBeInTheDocument();
  });

  it("renders other player's secrets, showing revealed and hiding non-revealed cards", () => {
    const otherPlayerSecrets = [
      { name: "Revealed Secret", revealed: true },
      { name: "Hidden Secret", revealed: false }
    ];
    render(
      <CardZoomModal
        isOpen={true}
        onClose={mockOnClose}
        cards={otherPlayerSecrets}
        modalType="secrets"
        viewingOwnSecrets={false}
      />
    );

    expect(screen.getByAltText("Revealed Secret")).toBeInTheDocument();
    expect(screen.getByAltText("Secret card")).toBeInTheDocument();
    expect(screen.queryByAltText("Hidden Secret")).not.toBeInTheDocument();
  });

  it("renders set cards with correct image src and alt", () => {
    const setCards = [
      { id: "1", type: "MM", game_id: "123", owner_player_id: "123p" },
      { id: "2", type: "MS", game_id: "123", owner_player_id: "456p" }
    ];

    render(
      <CardZoomModal
        isOpen={true}
        onClose={mockOnClose}
        cards={setCards}
        modalType="sets"
      />
    );

    const mmCard = screen.getByAltText("MM");
    const msCard = screen.getByAltText("MS");

    expect(mmCard).toBeInTheDocument();
    expect(mmCard).toHaveAttribute("src", "/cards/D_MM.webp");

    expect(msCard).toBeInTheDocument();
    expect(msCard).toHaveAttribute("src", "/cards/D_MS.webp");
  });

  it("does not render secret or card back images when modalType is 'sets'", () => {
    const sets = [
      { id: "3", type: "TB" },
      { id: "4", type: "TUB" }
    ];

    render(
      <CardZoomModal
        isOpen={true}
        onClose={mockOnClose}
        cards={sets}
        modalType="sets"
      />
    );

    expect(screen.queryByAltText("Secret card")).not.toBeInTheDocument();

    expect(screen.getByAltText("TB")).toBeInTheDocument();
    expect(screen.getByAltText("TUB")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    render(<CardZoomModal isOpen={true} onClose={mockOnClose} cards={[]} />);

    const closeButton = screen.getByRole("button", { name: "✕" });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the 'Escape' key is pressed", () => {
    render(<CardZoomModal isOpen={true} onClose={mockOnClose} cards={[]} />);

    fireEvent.keyDown(document.body, { key: "Escape" });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
