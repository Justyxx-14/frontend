import { motion } from "framer-motion";
import SecretButton from "./SecretButton";
import SetsButton from "./SetsButton";

const PlayerLayout = ({
  player,
  isCurrentTurn,
  i,
  totalPlayers,
  onSecretButtonClick,
  onSetsButtonClick,
}) => {
  
  const radiusX = 900; // ancho de la elipse
  const radiusY = 500;  // altura de la elipse
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
        transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
      }}
    >
      <motion.div
        className="flex flex-col items-center space-y-2 text-center"
      >
        {/* otherPlayers */}
        <div className="absolute flex flex-col items-center">
          <div
            className={`w-16 h-16 rounded-full border-2 border-gray-500 ${
              isCurrentTurn ? "shadow-[0_0_25px_5px_gold]" : ""
            } flex items-center justify-center bg-neutral-900 overflow-hidden`}
          >
            <img
              src="/avatar.webp"
              alt="Avatar"
              className="w-full h-full object-cover object-center"
              draggable={false}
            />
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
