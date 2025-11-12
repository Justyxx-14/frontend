import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";

/*  RadiusFill - isActive: boolean -> controls whether to fill (6.5s) *
		resetKey: any -> when changed, forces a rewind and (if isActive) restarts the animation
 */
export default function RadiusFill({ isActive, resetKey = null }) {
  const controls = useAnimationControls();
  const [isVisible, setIsVisible] = useState(false);
  const hideTimerRef = useRef(null);
  const prevReset = useRef(resetKey);

  useEffect(() => {
    if (!controls?.set) return;
    controls.set({ strokeDashoffset: 100 });
  }, [controls]);

  useEffect(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (isActive) {
      setIsVisible(true);
      const t = setTimeout(() => {
        controls.start({
          strokeDashoffset: 0,
          transition: { duration: 6.5, ease: "linear" }
        });
      }, 10);
      return () => clearTimeout(t);
    } else {
      controls.start({
        strokeDashoffset: 100,
        transition: { duration: 0.8, ease: "easeInOut" }
      });
      hideTimerRef.current = setTimeout(() => setIsVisible(false), 800);
    }
  }, [isActive, controls]);

  useEffect(() => {
    if (prevReset.current === resetKey) return; // no cambio
    prevReset.current = resetKey;

    controls.start({
      strokeDashoffset: 100,
      transition: { duration: 0.5, ease: "easeInOut" }
    });

    if (isActive) {
      const t = setTimeout(() => {
        setIsVisible(true);
        if (controls?.start) {
          controls.start({
            strokeDashoffset: 0,
            transition: { duration: 6.5, ease: "linear" }
          });
        }
      }, 300);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(
    () => () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    },
    []
  );

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          data-testid="nsf-spinner"
          className="absolute flex items-center justify-center lg:-top-10 md:-top-8 sm:-top-6 left-1/2 -translate-x-1/2 z-50 -translate-y-3"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
        >
          <svg
            className="w-10 h-10 transform -rotate-90 drop-shadow-[0_0_6px_#facc15]"
            viewBox="0 0 36 36"
          >
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke="rgba(80,80,80,0.5)"
              strokeWidth="6"
            />
            <motion.circle
              cx="18"
              cy="18"
              r="15.915"
              fill="none"
              stroke="#facc15"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="100"
              initial={{ strokeDashoffset: 100 }}
              animate={controls}
            />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
