import { motion } from "framer-motion";
import { Layers } from "lucide-react";

export default function SetsButton({ onClick }) {
  return (
    <motion.button
      data-testid="sets-button"
      onClick={onClick}
      className="
                absolute 
                lg:-top-3 lg:-left-20 md:-top-3 md:-left-15 sm:-top-3 sm:-left-11
                lg:w-8 md:w-6 sm:w-4 lg:h-8 md:h-6 sm:h-4 
                rounded-full bg-yellow-700
                text-gray-200
                flex items-center justify-center
                hover:scale-110 hover:shadow-[#7a602e]
                transition-all duration-200
                border-1 border-black
                "
      whileTap={{ scale: 0.95 }}
    >
      <Layers className="lg:w-6 lg:h-6 md:w-4 md:h-4 sm:w-3 sm:h-3 text-white" />
    </motion.button>
  );
}