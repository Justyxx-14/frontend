import { render, screen, fireEvent} from "@testing-library/react";
import { vi, it, describe, beforeEach, expect } from "vitest";
import FormCreateUser from "./FormCreateUser";

// mock useGame
vi.mock("@context/useGame", () => ({
  useGame: () => ({ setUser: mockSetUser }),
}));

let mockSetUser;

describe("FormCreateUser", () => {
  beforeEach(() => {
    mockSetUser = vi.fn();
  });

  it("debe renderizar título e inputs", () => {
    render(<FormCreateUser formRef={{}} />);
    expect(screen.getByText("User register")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Birthdate:")).toBeInTheDocument();
  });

  it("debe actualizar el contexto al escribir en el input de nombre", () => {
    render(<FormCreateUser formRef={{}} />);
    const input = screen.getByPlaceholderText("Username");
    fireEvent.change(input, { target: { value: "Marcos" } });
    expect(mockSetUser).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Marcos" })
    );
  });

  it("debe actualizar el contexto al elegir fecha", () => {
    render(<FormCreateUser formRef={{}} />);
    const dateInput = screen.getByLabelText("Birthdate:");
    fireEvent.change(dateInput, { target: { value: "2000-01-01" } });
    expect(mockSetUser).toHaveBeenCalledWith(
      expect.objectContaining({ birthday: "2000-01-01" })
    );
  });
});
