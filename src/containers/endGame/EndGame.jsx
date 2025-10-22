import React, { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";

const PlayerRoleCard = ({ player, delay, isWinner }) => {
  const getRoleDetails = role => {
    switch (role) {
      case "MURDERER":
        return { name: "Murderer", color: "bg-red-600" };
      case "ACCOMPLICE":
        return { name: "Accomplice", color: "bg-amber-500" };
      case "DETECTIVE":
      default:
        return { name: "Detective", color: "bg-cyan-500" };
    }
  };

  const roleDetails = getRoleDetails(player.role);
  const winnerBorder = isWinner ? "border-yellow-400" : "border-gray-600";

  return (
    <motion.div
      className="flex flex-col items-center text-center bg-gray-800 p-4 rounded-xl shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.2 }}
    >
      <img
        src="/avatar.webp"
        alt={player.name}
        className={`w-24 h-24 rounded-full border-4 ${winnerBorder} mb-2`}
      />
      <p className="text-xl font-bold text-white">{player.name}</p>
      <p
        className={`text-lg font-semibold px-3 py-1 rounded-md mt-1 ${roleDetails.color}`}
      >
        {roleDetails.name}
      </p>
    </motion.div>
  );
};

const EndGame = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { gameResult, currentPlayerId } = location.state || {};

  useEffect(() => {
    if (!gameResult) {
      navigate("/");
    }
  }, [gameResult, navigate]);

  if (!gameResult) return null;

  const amIWinner = gameResult.winners.some(w => w.id === currentPlayerId);

  const getEndGameReason = reason => {
    switch (reason) {
      case "MURDERER_REVEALED":
        return "The Murderer has been revealed!";
      case "SECRETS_REVEALED":
        return "All secrets have been revealed!";
      case "DECK_EMPTY":
        return "The deck has run out of cards.";
      default:
        return "The match has ended";
    }
  };

  const detectives = gameResult.player_roles.filter(
    p => p.role === "DETECTIVE"
  );
  const murderers = gameResult.player_roles.filter(p => p.role === "MURDERER");
  const accomplices = gameResult.player_roles.filter(
    p => p.role === "ACCOMPLICE"
  );
  const lowerRow = [...murderers, ...accomplices];

  const showSingleRow = detectives.length === 1 && lowerRow.length === 1;

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-between p-4 lg:p-8 overflow-hidden">
      <div className="w-full max-w-6xl flex flex-col items-center justify-center space-y-4 flex-grow">
        <motion.div
          className="text-center"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
        >
          <h1
            className={`text-5xl md:text-7xl font-black mb-2 ${
              amIWinner ? "text-green-400" : "text-red-600"
            }`}
          >
            {amIWinner ? "VICTORY" : "DEFEAT"}
          </h1>
          <h2 className="text-lg md:text-2xl text-gray-300">
            {getEndGameReason(gameResult.reason)}
          </h2>
        </motion.div>

        {gameResult.reason === "DECK_EMPTY" && (
          <motion.img
            src="/cards/MURESCAPE.webp"
            alt="Deck empty"
            className="rounded-2xl shadow-2xl w-20 md:w-30 select-none"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            draggable="false"
          />
        )}

        {gameResult.reason === "SECRETS_REVEALED" && (
          <motion.img
            src="/cards/MURESCAPE.webp"
            alt="Secrets revealed"
            className="rounded-2xl shadow-2xl w-20 md:w-30 select-none"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            draggable="false"
          />
        )}

        {gameResult.reason === "MURDERER_REVEALED" && (
          <motion.img
            src="/cards/NOESCAPE.webp"
            alt="Murderer revealed"
            className="rounded-2xl shadow-2xl w-20 md:w-30 select-none"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            draggable="false"
          />
        )}

        <div className="flex flex-col justify-between items-center flex-grow w-full max-h-[60vh]">
          {showSingleRow ? (
            <div className="flex justify-center items-center gap-6 flex-wrap">
              {[...detectives, ...lowerRow].map((p, i) => (
                <PlayerRoleCard
                  key={p.id}
                  player={p}
                  delay={i}
                  isWinner={gameResult.winners.some(w => w.id === p.id)}
                />
              ))}
            </div>
          ) : (
            <>
              <div className="flex justify-center items-center gap-6 flex-wrap mb-4">
                {detectives.map((p, i) => (
                  <PlayerRoleCard
                    key={p.id}
                    player={p}
                    delay={i}
                    isWinner={gameResult.winners.some(w => w.id === p.id)}
                  />
                ))}
              </div>

              {lowerRow.length > 0 && (
                <div className="flex justify-center items-center gap-6 flex-wrap">
                  {lowerRow.map((p, i) => (
                    <PlayerRoleCard
                      key={p.id}
                      player={p}
                      delay={i + detectives.length}
                      isWinner={gameResult.winners.some(w => w.id === p.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <Link
          to="/"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 md:py-3 md:px-8 rounded-lg text-lg md:text-xl transition-colors mt-4"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default EndGame;
