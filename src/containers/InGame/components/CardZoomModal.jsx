import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye } from "lucide-react";

export default function CardZoomModal({
  modalType,
  isOpen,
  onClose,
  cards = [],
  title = "",
  viewingOwnSecrets = false
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = event => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-label="Card zoom modal"
        >
          <motion.div
            className="relative w-full h-full flex flex-col items-center justify-center p-10"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
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

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-8 text-red-500 hover:text-red-400 text-4xl font-bold transition-transform duration-200 hover:scale-110"
            >
              ✕
            </button>

            {/* Cards */}
            <div
              className={`grid gap-12 justify-center items-center ${
                cards.length <= 3
                  ? `grid-cols-${cards.length}`
                  : cards.length <= 6
                  ? "grid-cols-3"
                  : "grid-cols-6"
              }`}
            >
              {cards.map((card, i) => {
                const showFront =
                  modalType === "cards" || viewingOwnSecrets || card.revealed;

                const cardSrc =
                  modalType === "sets"
                    ? `/cards/D_${card.type}.webp`
                    : showFront
                    ? `/${modalType}/${card.name}.webp`
                    : "/cards/C_BACK.webp";

                const cardAlt =
                  modalType === "sets"
                    ? card.type
                    : showFront
                    ? card.name
                    : "Secret card";

                return (
                  <motion.div
                    key={`modal-card-${i}`}
                    className="relative hover:scale-105 "
                    whileHover={{ y: -10 }}
                  >
                    <motion.img
                      src={cardSrc}
                      alt={cardAlt}
                      className="
                        rounded-2xl shadow-2xl w-[200px]
                        sm:w-[240px] md:w-[250px] lg:w-[280px] 
                        transition-transform duration-200"
                      draggable={false}
                    />

                    {viewingOwnSecrets && card.revealed && (
                      <div className="absolute top-3 right-3 bg-black/70 rounded-full p-1">
                        <Eye className="w-7 h-7 text-white" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
