import { render } from "@testing-library/react";
import { describe, it, vi, expect, beforeEach } from "vitest";
import MenuLayout from "./MenuLayout";

// subcomponentes's mocks
const mockFormCreateUser = vi.fn(() => <div>Mock FormCreateUser</div>);
const mockFormCreateGame = vi.fn(() => <div>Mock FormCreateGame</div>);
const mockTable = vi.fn(() => <div>Mock Table</div>);

vi.mock("./FormCreateUser", () => ({
  default: (props) => mockFormCreateUser(props),
}));

vi.mock("./FormCreateGame", () => ({
  default: (props) => mockFormCreateGame(props),
}));

vi.mock("./Table", () => ({
  default: (props) => mockTable(props),
}));

describe("MenuLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza los subcomponentes con las props correctas", () => {
    const mockGames = [{ id: 1, name: "Test Game" }];
    const mockJoinGame = vi.fn();
    const mockCreateGame = vi.fn();
    const mockFormRef = { current: null };

    render(
      <MenuLayout
        games={mockGames}
        joinGame={mockJoinGame}
        createGame={mockCreateGame}
        formRef={mockFormRef}
      />
    );

    expect(mockFormCreateUser).toHaveBeenCalledTimes(1);
    expect(mockFormCreateGame).toHaveBeenCalledTimes(1);
    expect(mockTable).toHaveBeenCalledTimes(1);

    expect(mockFormCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({ formRef: mockFormRef })
    );

    expect(mockFormCreateGame).toHaveBeenCalledWith(
      expect.objectContaining({ createGame: mockCreateGame })
    );

    expect(mockTable).toHaveBeenCalledWith(
      expect.objectContaining({
        games: mockGames,
        eventDoubleClick: mockJoinGame,
      })
    );
  });
});
