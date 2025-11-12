import { useState } from "react";
import { Lock, Globe, X} from "lucide-react";
import PasswordModal from "./PasswordModal";

const Table = ({ eventDoubleClick, games, validateForm }) => {
  const [selectedGame, setSelectedGame] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handleRowDoubleClick = (game) => {
    if (validateForm && !validateForm()) {
      return; // Detener si el formulario no está completo
    }
    if (game.hasPassword) {  // ← Cambiado de game.password a game.hasPassword
      // Juego con contraseña - mostrar modal
      setSelectedGame(game);
      setShowPasswordModal(true);
      setPasswordError(""); // Resetear error al abrir modal
    } else {
      // Juego público - unirse directamente
      eventDoubleClick(game);
    }
  };

  const handlePasswordConfirm = async (password) => {
    if (!selectedGame) return;

    try {
      const success = await eventDoubleClick(selectedGame, password);
      if (success) {
        setShowPasswordModal(false);
        setSelectedGame(null);
        setPasswordError("");
      }
    } catch (error) {
      const errorDetail = error.response?.data?.detail || error.message || "";
      
      if (errorDetail.includes("Wrong password")) {
        setPasswordError(    <span className="flex items-center gap-2">
          <X size={26} className="text-red-500" />
          This game requires a password.
        </span>
        );
      } else if (errorDetail.includes("Password required")) {
        setPasswordError(    <span className="flex items-center gap-2">
          <X size={26} className="text-red-500" />
          This game requires a password.
        </span>
        );
      } else {
        setPasswordError(    <span className="flex items-center gap-2">
          <X size={26} className="text-red-500" />
          Error joining the game. Please try again.
        </span>
        );
        setTimeout(() => {
          setShowPasswordModal(false);
          setSelectedGame(null);
          setPasswordError("");
          alert("Error joining the game. Please try again.");
        }, 1000);
      }
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setSelectedGame(null);
    setPasswordError("");
  };

  const handleClearError = () => {
    setPasswordError("");
  };


  return (
    <>
      <div className="relative w-full h-64">
        {/* contenedor de la tabla con altura fija */}
        <table className="table-fixed w-full border-collapse border-red-900 h-13">
          <thead>
            <tr>
              <th className="font-serif text-xl text-red-200 tracking-wide text-center px-2 py-1 w-1/2 border-b border-red-900 bg-[#2b0a0a]">
                Game's Names
              </th>
              <th className="font-serif text-xl text-red-200 tracking-wide text-center px-2 py-1 w-1/2 border-b border-red-900 bg-[#2b0a0a]">
                Players
              </th>
              <th className="font-serif text-xl text-red-200 tracking-wide text-center px-2 py-1 w-1/5 border-b border-red-900 bg-[#2b0a0a]">
                Access
              </th>
            </tr>
          </thead>
          <tbody className="h-full opacity-60">
            {games &&
              games.map((game, i) => (
                <tr
                  key={i}
                  className="text-center cursor-pointer hover:bg-red-200 transition group"
                  onDoubleClick={() => handleRowDoubleClick(game)}
                >
                  <td className="text-red-200 group-hover:text-red-950 overflow-hidden text-ellipsis whitespace-nowrap px-2 py-1 text-center">
                    {game.name}
                  </td>
                  <td className="px-2 py-1">
                    {game.countPlayers < game.min_players ? (
                      <>
                        <span className="text-red-500 font-bold">
                          {game.countPlayers}
                        </span>
                        <span className="text-red-200 font-bold group-hover:text-red-950">
                          /{game.max_players}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-green-500 font-bold">
                          {game.countPlayers}
                        </span>
                        <span className="text-red-200 font-bold group-hover:text-red-950">
                          /{game.max_players}
                        </span>
                      </>
                    )}
                  </td>
                  <td className="px-2 py-1">
                    {game.hasPassword ? (
                      <span className="flex items-center justify-center gap-1 text-yellow-400 text-sm font-semibold">
                        <Lock size={16} />
                        Private
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1 text-green-400 text-sm font-semibold">
                        <Globe size={16} />
                        Public
                        </span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {games && games.length === 0 && (
          <div className="absolute inset-0 flex justify-center items-center">
            <div
              role="status"
              className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-200"
            ></div>
          </div>
        )}
      </div>

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={handlePasswordCancel}
        onConfirm={handlePasswordConfirm}
        onClearError={handleClearError}
        gameName={selectedGame?.name}
        error={passwordError}
      />
    </>
  );
};

export default Table;