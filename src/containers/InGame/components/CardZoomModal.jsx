import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MixSetCard from "./MixSetCard";

export default function CardZoomModal({
  modalType,
  isOpen,
  onClose,
  cards = [],
  viewingOwnSecrets = false,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
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
                  ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
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

                
                if (modalType === "sets" && ["SIBLINGS_B", "HARLEY_MS"].includes(card.type)) {
                  return <MixSetCard key={i} cardType={card.type} index={i} />;
                }
                
                return (
                  <motion.img
                    key={`modal-card-${i}`}
                    src={cardSrc}
                    alt={cardAlt}
                    className="
                      rounded-2xl shadow-2xl w-[200px]
                      sm:w-[240px] md:w-[250px] lg:w-[280px] 
                      hover:scale-105 transition-transform duration-200"
                    whileHover={{ y: -10 }}
                    draggable={false}
                  />
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
