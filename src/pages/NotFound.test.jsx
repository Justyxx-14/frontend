import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import NotFound from "./NotFound";

describe("NotFound Page", () => {
  it("should render the 404 heading and message", () => {
    render(<NotFound />);

    const heading = screen.getByRole("heading", { name: "404", level: 1 });
    expect(heading).toBeInTheDocument();

    const message = screen.getByText("Page not found");
    expect(message).toBeInTheDocument();
  });
});
