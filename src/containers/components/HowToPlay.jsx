import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

const slideImages = [
  "/rules/imagen-01.png",
  "/rules/imagen-02.png",
  "/rules/imagen-03.png",
  "/rules/imagen-04.png",
  "/rules/imagen-05.png",
  "/rules/imagen-06.png",
  "/rules/imagen-07.png",
  "/rules/imagen-08.png",
  "/rules/imagen-09.png",
  "/rules/imagen-10.png",
  "/rules/imagen-11.png",
  "/rules/imagen-12.png",
  "/rules/imagen-13.png",
  "/rules/imagen-14.png"
];

const variants = {
  enter: direction => ({
    x: direction > 0 ? 500 : -500,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: direction => ({
    zIndex: 0,
    x: direction < 0 ? 500 : -500,
    opacity: 0
  })
};

export default function HowToPlayModal({ isOpen, onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const nextSlide = () => {
    setDirection(1);
    setCurrentSlide(prev => (prev === slideImages.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentSlide(prev => (prev === 0 ? slideImages.length - 1 : prev - 1));
  };

  useEffect(() => {
    if (!isOpen) {
      setCurrentSlide(0);
      setIsZoomed(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = event => {
      if (event.key === "Escape") {
        if (isZoomed) {
          setIsZoomed(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isZoomed, onClose]);
  return (
    <>
      {/* ---  Carrousel --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-label="How to play"
          >
            <motion.div
              className="relative w-full max-w-2xl bg-neutral-900 rounded-2xl shadow-2xl border border-gray-700 flex flex-col"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            >
              {/* --- Close --- */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-30"
                aria-label="Close"
              >
                <X className="w-8 h-8" />
              </button>

              {/* --- Content --- */}
              <div className="relative p-8 overflow-hidden h-[60vh] md:h-[70vh] flex flex-col justify-center items-center">
                <AnimatePresence initial={false} custom={direction}>
                  <motion.img
                    key={currentSlide}
                    src={slideImages[currentSlide]}
                    alt={`Rule Page ${currentSlide + 1}`}
                    className="absolute w-auto h-full max-h-[90%] object-contain rounded-lg shadow-lg cursor-zoom-in"
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 }
                    }}
                    onClick={() => setIsZoomed(true)}
                    draggable={false}
                  />
                </AnimatePresence>
              </div>

              {/* --- Navegation of carrousel --- */}
              <div className="flex justify-between items-center p-4 border-t border-gray-700 bg-neutral-800 rounded-b-2xl">
                <button
                  onClick={prevSlide}
                  className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                  aria-label="Previous"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex gap-2">
                  {slideImages.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        i === currentSlide ? "bg-yellow-400" : "bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={nextSlide}
                  className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                  aria-label="Next"
                >
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Zoom --- */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsZoomed(false)}
          >
            <motion.img
              src={slideImages[currentSlide]}
              alt={`Rule Page ${currentSlide + 1} (zoom)`}
              className="max-w-[95vw] max-h-[95vh] h-auto w-auto object-contain"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
