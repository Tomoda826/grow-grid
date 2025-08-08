import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

interface PinBoardProps {
  earnedPins: number;          // silver
  interestPins: number;        // gold
  totalPins?: number;          // default 1 000
  cols?: number;               // default 25  (=> 25 × 40)
}

/* staggered waterfall */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.003 } },
};
const child = {
  hidden: { scale: 0 },
  show:  { scale: 1 },
};

const Pin = ({ type }: { type: "silver" | "gold" | "empty" }) => (
  <motion.div
    variants={child}
    className={clsx(
      "w-2 h-2 sm:w-[9px] sm:h-[9px] rounded-full",
      type === "silver" && "bg-gray-400 dark:bg-gray-300",
      type === "gold"   && "bg-yellow-400",
      type === "empty"  && "bg-muted"
    )}
  />
);

const PinBoard: React.FC<PinBoardProps> = ({
  earnedPins,
  interestPins,
  totalPins = 1000,
  cols = 25,
}) => {
  const pins = Array.from({ length: totalPins }, (_, i) => {
    if (i < earnedPins) return "silver";
    if (i < earnedPins + interestPins) return "gold";
    return "empty";
  }) as ("silver" | "gold" | "empty")[];

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <div
        className="grid gap-[1.5px]"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        <AnimatePresence>{pins.map((p, i) => <Pin key={i} type={p} />)}</AnimatePresence>
      </div>
    </motion.div>
  );
};

export default PinBoard;
