import { motion } from "framer-motion";

export default function SecretButton({ onClick }) {
  return (
    <motion.button
      data-testid="secret-button"
      onClick={onClick}
      className="
                absolute top-8 -left-18
                w-8 h-8 rounded-full bg-yellow-700 text-gray-200
                flex items-center justify-center
                hover:scale-110 hover:shadow-[#7a602e]
                transition-all duration-200
                "
      whileTap={{ scale: 0.95 }}
    >
      🤫
    </motion.button>
  );
}