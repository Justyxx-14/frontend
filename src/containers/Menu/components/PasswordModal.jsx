import { useState } from "react";
import { Lock } from "lucide-react";

const PasswordModal = ({ isOpen, onClose, onConfirm, onClearError, gameName, error }) => {
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password.trim()) {
      onConfirm(password);
    }
  };

  const handleClose = () => {
    setPassword("");
    onClose();
  };

  const handleInputChange = (e) => {
    setPassword(e.target.value);
    // Limpiar el error cuando el usuario empiece a escribir
    if (error && onClearError) {
      onClearError();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#2b0a0a] border border-red-700 rounded-lg p-6 w-80">
        <h3 className="text-xl font-serif text-red-300 mb-4 flex items-center gap-2">
          <Lock size={20} className="text-yellow-400" />
          Private Game
        </h3>
        
        <p className="text-red-200 mb-2">
          <span className="font-semibold">{gameName}</span> requires a password
        </p>

        {error && (
          <div className="mb-4 p-2 bg-red-900 border border-red-600 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-red-200 text-sm mb-2">
              Contraseña:
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handleInputChange}
              placeholder="Enter password"
              className="w-full p-2 border border-red-700 rounded-md bg-black text-red-100 placeholder-red-400 focus:outline-none focus:ring-2 focus:ring-red-600"
              autoFocus
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-600 text-gray-200 rounded-md hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!password.trim()}
              className="px-4 py-2 bg-red-800 text-red-100 rounded-md hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Join
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;