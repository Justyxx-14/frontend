import { motion, AnimatePresence } from "framer-motion";

const CardItem = ({ card, onClick }) => (
  <motion.div
    onClick={onClick}
    className="cursor-pointer"
    whileHover={{ y: -10, scale: 1.05 }}
  >
    <img
      src={`/cards/${card.name}.webp`}
      alt={card.name}
      className="rounded-2xl shadow-2xl w-[200px] sm:w-[240px] md:w-[260px] lg:w-[300px] transition-transform duration-200"
      draggable={false}
    />
  </motion.div>
);

const PlayerItem = ({ player, onClick }) => (
  <motion.div
    onClick={onClick}
    className="flex flex-col items-center space-y-2 text-center cursor-pointer p-4 rounded-lg hover:bg-gray-700 transition-colors"
    whileHover={{ scale: 1.05 }}
  >
    <div
      className={`w-24 h-24 rounded-full border-4 border-gray-500 flex items-center justify-center bg-neutral-900 overflow-hidden`}
    >
      <img
        src="/avatar.webp"
        alt="Avatar"
        className="w-full h-full object-cover object-center"
      />
    </div>
    <span className="text-xl font-semibold text-center mt-1 text-white">
      {player.name}
    </span>
  </motion.div>
);

const SecretItem = ({ secret, onClick, viewingPlayerId }) => {
  {
    const isMySecret = viewingPlayerId === secret.owner_player_id;
    const showFront = isMySecret || secret.revealed;
    return (
      <motion.div
        onClick={onClick}
        className="cursor-pointer"
        whileHover={{ y: -10, scale: 1.05 }}
      >
        <img
          src={
            showFront ? `/secrets/${secret.name}.webp` : "/secrets/S_BACK.webp"
          }
          alt={showFront ? secret.name : "Secret card"}
          className="rounded-2xl shadow-2xl w-[200px] sm:w-[240px] md:w-[260px] lg:w-[300px] transition-transform duration-200"
          draggable={false}
        />
      </motion.div>
    );
  }
};

const SelectionModal = ({
  isOpen,
  title,
  items = [],
  itemType, // 'card' | 'player' | 'secret'
  onSelect,
  viewingPlayerId
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-label="Selection Modal"
        >
          {/* Title */}
          <motion.h2
            className="text-3xl font-bold text-white mb-8 text-center"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {title}
          </motion.h2>

          {/* Content */}
          <motion.div
            className="flex flex-wrap gap-8 justify-center items-center"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 150 }}
          >
            {items.map(item => {
              if (itemType === "card") {
                return (
                  <CardItem
                    key={item.id}
                    card={item}
                    onClick={() => onSelect(item.id)}
                  />
                );
              }
              if (itemType === "player") {
                return (
                  <PlayerItem
                    key={item.id}
                    player={item}
                    onClick={() => onSelect(item.id)}
                  />
                );
              }
              if (itemType === "secret") {
                return (
                  <SecretItem
                    key={item.id}
                    secret={item}
                    onClick={() => onSelect(item.id)}
                    viewingPlayerId={viewingPlayerId}
                  />
                );
              }
              return null;
            })}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default SelectionModal;
