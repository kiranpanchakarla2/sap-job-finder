"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type AuthCardProps = {
  children: ReactNode;
  className?: string;
};

export function AuthCard({ children, className = "" }: AuthCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-[24px] border border-border bg-card/90 p-6 shadow-soft backdrop-blur-xl sm:p-8 ${className}`.trim()}
    >
      {children}
    </motion.div>
  );
}
