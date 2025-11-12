import { render, screen, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import RadiusFill from "./RadiusFill";
import React from "react";

// --- Mocks ---
const mockControls = {
  start: vi.fn(),
  set: vi.fn()
};

vi.mock("framer-motion", async () => {
  const React = await import("react");
  return {
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: {
      div: React.forwardRef(({ children, ...props }, ref) => (
        <div {...props} ref={ref}>
          {children}
        </div>
      )),
      circle: React.forwardRef(({ children, ...props }, ref) => (
        <circle {...props} ref={ref}>
          {children}
        </circle>
      ))
    },
    useAnimationControls: () => mockControls
  };
});

describe("RadiusFill Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should not be visible when isActive is initially false", () => {
    render(<RadiusFill isActive={false} />);
    expect(screen.queryByTestId("nsf-spinner")).not.toBeInTheDocument();
  });

  it("should become visible and start fill animation when isActive becomes true", async () => {
    const { rerender } = render(<RadiusFill isActive={false} />);
    expect(screen.queryByTestId("nsf-spinner")).not.toBeInTheDocument();

    rerender(<RadiusFill isActive={true} />);

    expect(screen.getByTestId("nsf-spinner")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    expect(mockControls.start).toHaveBeenCalledWith({
      strokeDashoffset: 0,
      transition: { duration: 6.5, ease: "linear" }
    });
  });

  it("should start rewind animation and hide after 800ms when isActive becomes false", async () => {
    const { rerender } = render(<RadiusFill isActive={true} />);

    await act(async () => {
      vi.advanceTimersByTime(20);
    });
    expect(screen.getByTestId("nsf-spinner")).toBeInTheDocument();
    mockControls.start.mockClear(); // Limpia la llamada de 'start' anterior

    rerender(<RadiusFill isActive={false} />);

    expect(mockControls.start).toHaveBeenCalledWith({
      strokeDashoffset: 100,
      transition: { duration: 0.8, ease: "easeInOut" }
    });

    await act(async () => {
      vi.advanceTimersByTime(790);
    });
    expect(screen.getByTestId("nsf-spinner")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(20);
    });
    expect(screen.queryByTestId("nsf-spinner")).not.toBeInTheDocument();
  });

  it("should reset and restart animation when resetKey changes and isActive is true", async () => {
    const { rerender } = render(<RadiusFill isActive={true} resetKey={1} />);

    await act(async () => {
      vi.advanceTimersByTime(20);
    });
    expect(mockControls.start).toHaveBeenCalledTimes(1);
    expect(mockControls.start).toHaveBeenLastCalledWith(
      expect.objectContaining({ strokeDashoffset: 0 })
    );

    rerender(<RadiusFill isActive={true} resetKey={2} />);

    expect(mockControls.start).toHaveBeenLastCalledWith(
      expect.objectContaining({ strokeDashoffset: 100 })
    );

    await act(async () => {
      vi.advanceTimersByTime(310);
    });

    expect(mockControls.start).toHaveBeenLastCalledWith(
      expect.objectContaining({ strokeDashoffset: 0 })
    );
    expect(mockControls.start).toHaveBeenCalledTimes(3);
  });

  it("should only reset (not restart) when resetKey changes and isActive is false", async () => {
    const { rerender } = render(<RadiusFill isActive={false} resetKey={1} />);

    await act(async () => {
      vi.advanceTimersByTime(810);
    });
    expect(screen.queryByTestId("nsf-spinner")).not.toBeInTheDocument();
    mockControls.start.mockClear();

    rerender(<RadiusFill isActive={false} resetKey={2} />);

    expect(mockControls.start).toHaveBeenCalledWith(
      expect.objectContaining({ strokeDashoffset: 100 })
    );

    await act(async () => {
      vi.advanceTimersByTime(310);
    });

    expect(mockControls.start).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("nsf-spinner")).not.toBeInTheDocument();
  });

  it("should clear timeouts on unmount", () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
    const { unmount } = render(<RadiusFill isActive={false} />);

    act(() => {
      vi.advanceTimersByTime(20);
    });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
