import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SecretButton from "./SecretButton";

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

describe("SecretButton", () => {
  it("renders correctly with the icon", () => {
    render(<SecretButton onClick={() => {}} />);
    const button = screen.getByTestId("secret-button");
    expect(button).toBeInTheDocument();
  });

  it("calls the onClick handler when the button is clicked", () => {
    const mockOnClick = vi.fn();
    render(<SecretButton onClick={mockOnClick} />);

    const button = screen.getByTestId("secret-button");
    fireEvent.click(button);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
