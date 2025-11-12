import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import SecretButton from "./SecretButton";
import SetsButton from "./SetsButton";

const avatartam = "lg:w-16 lg:h-16 md:w-14 md:h-14 sm:w-12 sm:h-12 ";
const PlayerLayout = ({
  player,
  isCurrentTurn,
  i,
  totalPlayers,
  onSecretButtonClick,
  onSetsButtonClick
}) => {
  const [radiusX, setRadiusX] = useState(900);

  useEffect(() => {
    const updateRadius = () => {
      const width = window.innerWidth;
      if (width < 640) setRadiusX(300);
      else if (width < 1024) setRadiusX(600);
      else setRadiusX(900);
    };

    updateRadius();
    window.addEventListener("resize", updateRadius);
    return () => window.removeEventListener("resize", updateRadius);
  }, []);

  const radiusY = 500; // altura de la elipse
  const angleSpan = Math.PI / 3;
  const angleStart = -angleSpan / 2;
  const angleStep = angleSpan / (totalPlayers - 1);

  const angle = angleStart + i * angleStep;

  const x = radiusX * Math.sin(angle);
  const y = -radiusY * Math.cos(angle) + radiusY;
  return (
    <motion.div
      className="absolute"
      style={{
        left: "50%",
        transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`
      }}
    >
      <motion.div className="flex flex-col items-center lg:space-y-2 md:space-x-2 sm:space-x-1 text-center">
        {/* otherPlayers */}
        <div className="absolute flex flex-col items-center md:-my-1 sm:-my-2">
          <div
            className={`${avatartam} rounded-full border-2 border-gray-500 ${
              isCurrentTurn ? "shadow-[0_0_25px_5px_gold]" : ""
            } flex items-center justify-center bg-neutral-900 overflow-hidden`}
          >
            <img
              src="/avatar.webp"
              alt="Avatar"
              className="w-full h-full object-cover object-center"
              draggable={false}
            />
            {/* Social Disgrace  */}
            {player?.socialDisgrace && (
              <motion.div
                className="absolute pointer-events-none z-[9999]"
                initial={{ scale: 1 }}
                animate={{
                  scale: [1, 1.08, 1],
                  filter: [
                    "drop-shadow(0 0 6px rgba(255,0,0,0.6))",
                    "drop-shadow(0 0 14px rgba(255,0,0,1))",
                    "drop-shadow(0 0 6px rgba(255,0,0,0.6))"
                  ]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="relative group flex items-center justify-center pointer-events-auto z-[9999]">
                  <img
                    src="/socialDisgrace.webp"
                    alt="Social Disgrace"
                    draggable={false}
                    className="
          lg:w-20 lg:h-16 md:w-15 md:h-15 sm:w-12 sm:h-12
          opacity-80
          rounded-full
          cursor-help
        "
                  />
                  <span
                    className="
          absolute -top-10 left-1/2 -translate-x-1/2
          bg-[#55412a] text-white text-xs
          px-2 py-1 rounded-md shadow-lg
          opacity-0 group-hover:opacity-80
          transition-all duration-200 ease-in-out
          pointer-events-none
          z-[10000]
          whitespace-nowrap
        "
                  >
                    Player in social disgrace
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          <span className="text-sm font-semibold text-center mt-1">
            {player?.name}
          </span>
        </div>

        <SecretButton onClick={onSecretButtonClick} />
        <SetsButton onClick={onSetsButtonClick} />
      </motion.div>
    </motion.div>
  );
};

export default PlayerLayout;
