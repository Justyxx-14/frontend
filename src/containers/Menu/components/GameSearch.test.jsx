import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import GameSearch from "./GameSearch";

describe("GameSearch", () => {
  it("renders the input with the correct value", () => {
    const { getByPlaceholderText } = render(
      <GameSearch 
        searchTerm="test game" 
        onSearchChange={vi.fn()} 
        onClearSearch={vi.fn()} 
      />
    );

    const input = getByPlaceholderText("Search game...");
    expect(input.value).toBe("test game");
  });

  it("calls onSearchChange when typing in the input", () => {
    const mockOnSearchChange = vi.fn();
    const { getByPlaceholderText } = render(
      <GameSearch 
        searchTerm="" 
        onSearchChange={mockOnSearchChange} 
        onClearSearch={vi.fn()} 
      />
    );

    const input = getByPlaceholderText("Search game...");
    fireEvent.change(input, { target: { value: "new game" } });

    expect(mockOnSearchChange).toHaveBeenCalledWith("new game");
  });

  it("shows the clear button when searchTerm has a value", () => {
    const { getByRole } = render(
      <GameSearch 
        searchTerm="test" 
        onSearchChange={vi.fn()} 
        onClearSearch={vi.fn()} 
      />
    );

    const clearButton = getByRole("button");
    expect(clearButton).toBeInTheDocument();
  });

  it("does not show the clear button when searchTerm is empty", () => {
    const { queryByRole } = render(
      <GameSearch 
        searchTerm="" 
        onSearchChange={vi.fn()} 
        onClearSearch={vi.fn()} 
      />
    );

    const clearButton = queryByRole("button");
    expect(clearButton).not.toBeInTheDocument();
  });

  it("calls onClearSearch when clicking the clear button", () => {
    const mockOnClearSearch = vi.fn();
    const { getByRole } = render(
      <GameSearch 
        searchTerm="test" 
        onSearchChange={vi.fn()} 
        onClearSearch={mockOnClearSearch} 
      />
    );

    const clearButton = getByRole("button");
    fireEvent.click(clearButton);

    expect(mockOnClearSearch).toHaveBeenCalledTimes(1);
  });
});