import { motion } from "framer-motion";

export default function MixSetCard({ cardType, index }) {
  if (!["SIBLINGS_B", "HARLEY_MS"].includes(cardType)) return null;

  const pairMap = {
    SIBLINGS_B: [
      { src: "/cards/D_TB.webp", alt: "D_TB" },
      { src: "/cards/D_TUB.webp", alt: "D_TUB" },
    ],
    HARLEY_MS: [
      { src: "/cards/D_HQW.webp", alt: "D_HQW" },
      { src: "/cards/D_MS.webp", alt: "D_MS" },
    ],
  };

  const [first, second] = pairMap[cardType];

  return (
    <motion.div
      key={index}
      className="relative sm:w-[190px] md:w-[200px] lg:w-[230px] transition-transform duration-200"
      whileHover={{ y: -10, scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <img
        src={first.src}
        alt={first.alt}
        className="rounded-2xl shadow-2xl absolute bottom-8 right-4"
      />
      <img
        src={second.src}
        alt={second.alt}
        className="rounded-2xl shadow-2xl relative left-14 top-8"
      />
    </motion.div>
  );
}