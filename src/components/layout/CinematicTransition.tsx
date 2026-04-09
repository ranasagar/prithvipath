import { motion } from "motion/react";
import { ReactNode } from "react";

interface CinematicTransitionProps {
  children: ReactNode;
  className?: string;
}

export default function CinematicTransition({ children, className = "" }: CinematicTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
