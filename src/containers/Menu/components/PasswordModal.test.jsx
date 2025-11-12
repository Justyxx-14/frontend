import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import PasswordModal from "./PasswordModal";
import { X } from "lucide-react";

describe("PasswordModal", () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();
  const mockOnClearError = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onConfirm: mockOnConfirm,
    onClearError: mockOnClearError,
    gameName: "Test Game",
    error: null,
  };

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnConfirm.mockClear();
    mockOnClearError.mockClear();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <PasswordModal {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders correctly when isOpen is true", () => {
    render(<PasswordModal {...defaultProps} />);

    expect(screen.getByText("Private Game")).toBeInTheDocument();
    expect(screen.getByText("Test Game", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("requires a password", { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña:")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Join" })).toBeInTheDocument();
  });

  it("shows error message when error prop is provided", () => {
    const errorMessage = "Wrong password. Please try again.";
    const errorJSX = (
      <span className="flex items-center gap-2">
        <X size={16} className="text-red-500" />
        {errorMessage}
      </span>
    );
    
    render(<PasswordModal {...defaultProps} error={errorJSX} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    
    // Buscar por la clase de Lucide
    expect(
      screen.getByText(errorMessage)
        .closest('span')
        .querySelector('.lucide-x')
    ).toBeInTheDocument();
  });

  it("calls onClose when Cancel button is clicked", () => {
    render(<PasswordModal {...defaultProps} />);

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm with password when form is submitted", () => {
    render(<PasswordModal {...defaultProps} />);

    const passwordInput = screen.getByPlaceholderText("Enter password");
    const joinButton = screen.getByRole("button", { name: "Join" });

    fireEvent.change(passwordInput, { target: { value: "test123" } });
    fireEvent.click(joinButton);

    expect(mockOnConfirm).toHaveBeenCalledWith("test123");
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("does not call onConfirm when password is empty", () => {
    render(<PasswordModal {...defaultProps} />);

    const joinButton = screen.getByRole("button", { name: "Join" });
    fireEvent.click(joinButton);

    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it("disables Join button when password is empty", () => {
    render(<PasswordModal {...defaultProps} />);

    const joinButton = screen.getByRole("button", { name: "Join" });
    expect(joinButton).toBeDisabled();
  });

  it("enables Join button when password has value", () => {
    render(<PasswordModal {...defaultProps} />);

    const passwordInput = screen.getByPlaceholderText("Enter password");
    const joinButton = screen.getByRole("button", { name: "Join" });

    fireEvent.change(passwordInput, { target: { value: "a" } });

    expect(joinButton).toBeEnabled();
  });

  it("calls onClearError when user types and there is an error", () => {
    render(<PasswordModal {...defaultProps} error="❌ Wrong password" />);

    const passwordInput = screen.getByPlaceholderText("Enter password");
    fireEvent.change(passwordInput, { target: { value: "a" } });

    expect(mockOnClearError).toHaveBeenCalledTimes(1);
  });

  it("does not call onClearError when there is no error", () => {
    render(<PasswordModal {...defaultProps} error={null} />);

    const passwordInput = screen.getByPlaceholderText("Enter password");
    fireEvent.change(passwordInput, { target: { value: "a" } });

    expect(mockOnClearError).not.toHaveBeenCalled();
  });

  it("password input has correct type and autoFocus", () => {
    render(<PasswordModal {...defaultProps} />);

    const passwordInput = screen.getByPlaceholderText("Enter password");
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(passwordInput).toHaveFocus();
  });

  it("handles password with spaces correctly", () => {
    render(<PasswordModal {...defaultProps} />);

    const passwordInput = screen.getByPlaceholderText("Enter password");
    const joinButton = screen.getByRole("button", { name: "Join" });

    fireEvent.change(passwordInput, { target: { value: "  test  " } });
    fireEvent.click(joinButton);

    expect(mockOnConfirm).toHaveBeenCalledWith("  test  ");
  });

  it("does not submit form with only spaces in password", () => {
    render(<PasswordModal {...defaultProps} />);

    const passwordInput = screen.getByPlaceholderText("Enter password");
    const joinButton = screen.getByRole("button", { name: "Join" });

    fireEvent.change(passwordInput, { target: { value: "   " } });
    fireEvent.click(joinButton);

    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it("clears password when modal is closed via Cancel button", () => {
    const { rerender } = render(<PasswordModal {...defaultProps} />);

    const passwordInput = screen.getByPlaceholderText("Enter password");
    fireEvent.change(passwordInput, { target: { value: "test123" } });
    
    // Verificar que el input tiene el valor
    expect(passwordInput.value).toBe("test123");

    // Cerrar el modal haciendo click en Cancel
    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButton);

    // Reabrir el modal
    rerender(<PasswordModal {...defaultProps} isOpen={true} />);

    // El nuevo input debería estar vacío
    const newPasswordInput = screen.getByPlaceholderText("Enter password");
    expect(newPasswordInput.value).toBe("");
  });

  it("renders game name correctly in the message", () => {
    render(<PasswordModal {...defaultProps} gameName="My Awesome Game" />);

    expect(screen.getByText("My Awesome Game", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("requires a password", { exact: false })).toBeInTheDocument();
  });
});