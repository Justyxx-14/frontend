import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, AlarmClockOff } from "lucide-react";

export default function TurnTimer({ remainingTime, isMyTurn, timerIsPaused }) {
  const [timeLeft, setTimeLeft] = useState(remainingTime);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    setTimeLeft(remainingTime);
    setExpired(false);
  }, [remainingTime]);

  useEffect(() => {
    if (timerIsPaused) return;

    if (timeLeft <= 0) {
      if (isMyTurn) setExpired(true);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, isMyTurn, timerIsPaused]);

  const formatTime = seconds => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  const pulseAnimation =
    !timerIsPaused && timeLeft <= 6
      ? {
          backgroundColor: [
            "rgba(127, 29, 29, 1)",
            "rgba(31, 41, 55, 1)",
            "rgba(127, 29, 29, 1)"
          ],
          transition: {
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }
      : {};

  return (
    <>
      <AnimatePresence>
        {!expired && (
          <motion.div
            key="timer"
            className="fixed bottom-4 right-4 text-white px-4 py-2 rounded-2xl shadow-lg flex items-center gap-2"
            style={{ backgroundColor: "rgb(31, 41, 55)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ ...pulseAnimation, opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {timerIsPaused ? (
              <AlarmClockOff className="w-5 h-5 text-gray-400" />
            ) : (
              <Clock className="w-5 h-5 text-yellow-400" />
            )}
            <span
              className={`font-mono text-lg ${
                timeLeft <= 10 ? "text-red-400" : ""
              }`}
            >
              {formatTime(timeLeft)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
