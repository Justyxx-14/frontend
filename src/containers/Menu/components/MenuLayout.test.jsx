import { render, fireEvent } from "@testing-library/react";
import { describe, it, vi, expect, beforeEach } from "vitest";
import MenuLayout from "./MenuLayout";

const mockFormCreateUser = vi.fn(() => <div>Mock FormCreateUser</div>);
const mockFormCreateGame = vi.fn(() => <div>Mock FormCreateGame</div>);
const mockTable = vi.fn(() => <div>Mock Table</div>);
const mockGameSearch = vi.fn(() => <div>Mock GameSearch</div>);

vi.mock("./FormCreateUser", () => ({
  default: (props) => mockFormCreateUser(props),
}));

vi.mock("./FormCreateGame", () => ({
  default: (props) => mockFormCreateGame(props),
}));

vi.mock("./Table", () => ({
  default: (props) => mockTable(props),
}));

vi.mock("./GameSearch", () => ({
  default: (props) => mockGameSearch(props),
}));

describe("MenuLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    games: [
      { id: 1, name: "Test Game 1" },
      { id: 2, name: "Another Game" },
      { id: 3, name: "Different Game" },
    ],
    joinGame: vi.fn(),
    createGame: vi.fn(),
    formRef: { current: null },
  };

  it("renders subcomponents with the correct props", () => {
    render(<MenuLayout {...defaultProps} />);

    expect(mockFormCreateUser).toHaveBeenCalledTimes(1);
    expect(mockFormCreateGame).toHaveBeenCalledTimes(1);
    expect(mockTable).toHaveBeenCalledTimes(1);
    expect(mockGameSearch).toHaveBeenCalledTimes(1);

    expect(mockFormCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({ formRef: defaultProps.formRef })
    );

    expect(mockFormCreateGame).toHaveBeenCalledWith(
      expect.objectContaining({ createGame: defaultProps.createGame })
    );

    expect(mockTable).toHaveBeenCalledWith(
      expect.objectContaining({
        games: defaultProps.games, // Starting Games not filtered 
        eventDoubleClick: defaultProps.joinGame,
      })
    );
  });

  it("filters games correctly when searching", () => {
    const { rerender } = render(<MenuLayout {...defaultProps} />);

    // Simulate that GameSearch calls onSearchChange
    const searchCall = mockGameSearch.mock.calls[0][0];
    searchCall.onSearchChange("Test");

    // Re-render with the new state
    rerender(<MenuLayout {...defaultProps} />);

    // Table should receive the filtered games
    expect(mockTable).toHaveBeenCalledWith(
      expect.objectContaining({
        games: [{ id: 1, name: "Test Game 1" }],
      })
    );
  });

  it("filters games case insensitively", () => {
    const { rerender } = render(<MenuLayout {...defaultProps} />);

    const searchCall = mockGameSearch.mock.calls[0][0];
    searchCall.onSearchChange("another");

    rerender(<MenuLayout {...defaultProps} />);

    expect(mockTable).toHaveBeenCalledWith(
      expect.objectContaining({
        games: [{ id: 2, name: "Another Game" }],
      })
    );
  });

  it("shows all games when search is cleared", () => {
    const { rerender } = render(<MenuLayout {...defaultProps} />);

    // First search for something
    const searchCall = mockGameSearch.mock.calls[0][0];
    searchCall.onSearchChange("Test");
    rerender(<MenuLayout {...defaultProps} />);

    // Then clear the search
    searchCall.onClearSearch();
    rerender(<MenuLayout {...defaultProps} />);

    // Should show all games again
    expect(mockTable).toHaveBeenCalledWith(
      expect.objectContaining({
        games: defaultProps.games,
      })
    );
  });

  it("handles correctly when games is undefined", () => {
    const propsWithoutGames = { ...defaultProps, games: undefined };
    render(<MenuLayout {...propsWithoutGames} />);

    // Should not fail, Table will receive undefined
    expect(mockTable).toHaveBeenCalledWith(
      expect.objectContaining({
        games: undefined,
      })
    );
  });

  it("passes the correct props to GameSearch", () => {
    render(<MenuLayout {...defaultProps} />);

    expect(mockGameSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        searchTerm: "", // Initial value
        onSearchChange: expect.any(Function),
        onClearSearch: expect.any(Function),
      })
    );
  });
});