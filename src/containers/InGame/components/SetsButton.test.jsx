import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SetsButton from "./SetsButton";

// Mock framer-motion to simplify testing
vi.mock("framer-motion", async () => {
  const React = await import("react");
  return {
    motion: {
      button: React.forwardRef(({ children, ...props }, ref) => (
        <button {...props} ref={ref}>
          {children}
        </button>
      )),
    },
  };
});

describe("SetsButton", () => {
  it("renders correctly with the S icon", () => {
    render(<SetsButton onClick={() => {}} />);
    const button = screen.getByTestId("sets-button");
    expect(button).toBeInTheDocument();
  });

  it("calls the onClick handler when the button is clicked", () => {
    const mockOnClick = vi.fn();
    render(<SetsButton onClick={mockOnClick} />);

    const button = screen.getByTestId("sets-button");
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
