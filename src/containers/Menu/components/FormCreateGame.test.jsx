import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FormCreateGame from "./FormCreateGame";

describe("FormCreateGame", () => {
  it("renderiza los inputs y el botón Create game", () => {
    render(<FormCreateGame createGame={vi.fn()} />);

    expect(screen.getByPlaceholderText("Game name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter password (optional)")).toBeInTheDocument();
    expect(screen.getByLabelText("Minimum players")).toBeInTheDocument();
    expect(screen.getByLabelText("Maximum players")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create game/i })).toBeInTheDocument();
  });

  it("muestra error y deshabilita el botón si min > max", () => {
    render(<FormCreateGame createGame={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Minimum players"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("Maximum players"), {
      target: { value: "3" },
    });

    expect(
      screen.getByText("The minimum cannot be greater than the maximum")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create game/i })).toBeDisabled();
  });

  it("habilita el botón si min <= max y oculta el error", () => {
    render(<FormCreateGame createGame={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Minimum players"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Maximum players"), {
      target: { value: "4" },
    });

    expect(
      screen.queryByText("The minimum cannot be greater than the maximum")
    ).toBeNull();
    expect(screen.getByRole("button", { name: /Create game/i })).toBeEnabled();
  });

  it("llama a createGame con los datos correctos al enviar el formulario sin contraseña", () => {
    const createGameMock = vi.fn();
    render(<FormCreateGame createGame={createGameMock} />);

    fireEvent.change(screen.getByPlaceholderText("Game name"), {
      target: { value: "Mi Partida" },
    });
    fireEvent.change(screen.getByLabelText("Minimum players"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Maximum players"), {
      target: { value: "5" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Create game/i }));

    expect(createGameMock).toHaveBeenCalledWith({
      name: "Mi Partida",
      password: null,
      min: 2,
      max: 5,
    });
  });

  it("llama a createGame con contraseña cuando se ingresa una", () => {
    const createGameMock = vi.fn();
    render(<FormCreateGame createGame={createGameMock} />);

    fireEvent.change(screen.getByPlaceholderText("Game name"), {
      target: { value: "Mi Partida" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter password (optional)"), {
      target: { value: "mipass123" },
    });
    fireEvent.change(screen.getByLabelText("Minimum players"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Maximum players"), {
      target: { value: "5" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Create game/i }));

    expect(createGameMock).toHaveBeenCalledWith({
      name: "Mi Partida",
      password: "mipass123",
      min: 2,
      max: 5,
    });
  });

  it("convierte contraseña vacía a null", () => {
    const createGameMock = vi.fn();
    render(<FormCreateGame createGame={createGameMock} />);

    fireEvent.change(screen.getByPlaceholderText("Game name"), {
      target: { value: "Mi Partida" },
    });
    // No ingresar contraseña (ya está vacío por defecto)
    fireEvent.change(screen.getByLabelText("Minimum players"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Maximum players"), {
      target: { value: "5" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Create game/i }));

    expect(createGameMock).toHaveBeenCalledWith({
      name: "Mi Partida",
      password: null,
      min: 2,
      max: 5,
    });
  });
});