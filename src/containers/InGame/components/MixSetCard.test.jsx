import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import MixSetCard from "./MixSetCard";

// Mock framer-motion to avoid animation complexity in tests
vi.mock("framer-motion", async () => {
  const React = await import("react");
  return {
    motion: {
      div: React.forwardRef(({ children, ...props }, ref) => (
        <div data-testid="motion-div" {...props} ref={ref}>
          {children}
        </div>
      )),
    },
  };
});

describe("MixSetCard Component", () => {
  it("renders nothing when cardType is invalid", () => {
    const { container } = render(<MixSetCard cardType="INVALID" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders both cards for SIBLINGS_B type", () => {
    render(<MixSetCard cardType="SIBLINGS_B" index={0} />);

    const motionDiv = screen.getByTestId("motion-div");
    expect(motionDiv).toBeInTheDocument();

    const img1 = screen.getByAltText("D_TB");
    const img2 = screen.getByAltText("D_TUB");

    expect(img1).toHaveAttribute("src", "/cards/D_TB.webp");
    expect(img2).toHaveAttribute("src", "/cards/D_TUB.webp");
  });

  it("renders both cards for HARLEY_MS type", () => {
    render(<MixSetCard cardType="HARLEY_MS" index={1} />);

    const motionDiv = screen.getByTestId("motion-div");
    expect(motionDiv).toBeInTheDocument();

    const img1 = screen.getByAltText("D_HQW");
    const img2 = screen.getByAltText("D_MS");

    expect(img1).toHaveAttribute("src", "/cards/D_HQW.webp");
    expect(img2).toHaveAttribute("src", "/cards/D_MS.webp");
  });

  it("applies hover animation props to the motion div", () => {
    render(<MixSetCard cardType="SIBLINGS_B" index={0} />);
    const motionDiv = screen.getByTestId("motion-div");

    expect(motionDiv).toHaveAttribute("whilehover", "[object Object]");
  });
});
