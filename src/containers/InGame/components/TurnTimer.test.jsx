import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import TurnTimer from "./TurnTimer";

vi.mock("framer-motion", async () => {
  const React = await import("react");
  return {
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: {
      div: React.forwardRef(({ children, ...props }, ref) => (
        <div {...props} ref={ref}>
          {children}
        </div>
      ))
    }
  };
});

vi.mock("lucide-react", () => ({
  Clock: () => <div data-testid="clock-icon" />,
  AlarmClockOff: () => <div data-testid="alarm-icon" />
}));
describe("TurnTimer Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("should render the initial time correctly", () => {
    render(<TurnTimer remainingTime={60} isMyTurn={true} />);

    // format mm:ss
    expect(screen.getByText("01:00")).toBeInTheDocument();
    expect(screen.getByTestId("clock-icon")).toBeInTheDocument();
  });

  it("should count down by one second intervals", () => {
    render(<TurnTimer remainingTime={15} isMyTurn={true} />);
    expect(screen.getByText("00:15")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("00:14")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText("00:11")).toBeInTheDocument();
  });

  it("should apply the warning text color at 10 seconds or less", () => {
    render(<TurnTimer remainingTime={11} isMyTurn={true} />);
    const timerText = screen.getByText("00:11");

    expect(timerText).not.toHaveClass("text-red-400");

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("00:10")).toHaveClass("text-red-400");
  });

  it("should HIDE the timer when time runs out AND it is my turn", () => {
    render(<TurnTimer remainingTime={2} isMyTurn={true} />);

    expect(screen.getByText("00:02")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByTestId("clock-icon")).not.toBeInTheDocument();
    expect(screen.queryByText("00:00")).not.toBeInTheDocument();
  });

  it("should NOT HIDE the timer when time runs out AND it is NOT my turn", () => {
    render(<TurnTimer remainingTime={2} isMyTurn={false} />);

    expect(screen.getByText("00:02")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByTestId("clock-icon")).toBeInTheDocument();
    expect(screen.getByText("00:00")).toBeInTheDocument();
  });

  it("should reset the timer when the remainingTime prop changes (new turn)", () => {
    const { rerender } = render(
      <TurnTimer remainingTime={10} isMyTurn={true} />
    );
    expect(screen.getByText("00:10")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText("00:05")).toBeInTheDocument();

    rerender(<TurnTimer remainingTime={60} isMyTurn={true} />);

    expect(screen.getByText("01:00")).toBeInTheDocument();
  });

  it("should reappear if it was expired and a new turn starts", () => {
    const { rerender } = render(
      <TurnTimer remainingTime={1} isMyTurn={true} />
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByTestId("clock-icon")).not.toBeInTheDocument();

    rerender(<TurnTimer remainingTime={60} isMyTurn={true} />);

    expect(screen.getByTestId("clock-icon")).toBeInTheDocument();
    expect(screen.getByText("01:00")).toBeInTheDocument();
  });

  it("should clear the interval on unmount", () => {
    const clearIntervalSpy = vi.spyOn(global, "clearInterval");

    const { unmount } = render(
      <TurnTimer remainingTime={15} isMyTurn={true} />
    );

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalledOnce();
  });

  it("should NOT decrement time while timerIsPaused is true", () => {
    render(
      <TurnTimer remainingTime={10} isMyTurn={true} timerIsPaused={true} />
    );

    expect(screen.getByText("00:10")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText("00:10")).toBeInTheDocument();
  });

  it("should resume countdown when timerIsPaused becomes false", () => {
    const { rerender } = render(
      <TurnTimer remainingTime={10} isMyTurn={true} timerIsPaused={true} />
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText("00:10")).toBeInTheDocument();

    rerender(
      <TurnTimer remainingTime={10} isMyTurn={true} timerIsPaused={false} />
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText("00:08")).toBeInTheDocument();
  });

  it("should show the AlarmClockOff icon when timerIsPaused is true", () => {
    render(
      <TurnTimer remainingTime={10} isMyTurn={true} timerIsPaused={true} />
    );
    expect(screen.getByTestId("alarm-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("clock-icon")).not.toBeInTheDocument();
  });

  it("should show the Clock icon when timerIsPaused is false", () => {
    render(
      <TurnTimer remainingTime={10} isMyTurn={true} timerIsPaused={false} />
    );
    expect(screen.getByTestId("clock-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("alarm-icon")).not.toBeInTheDocument();
  });
});
