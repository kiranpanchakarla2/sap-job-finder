"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2 } from "lucide-react";

type AuthButtonProps = {
  children: ReactNode;
  loading?: boolean;
  variant?: "primary" | "secondary";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
};

export function AuthButton({
  children,
  loading = false,
  variant = "primary",
  type = "submit",
  disabled,
  onClick,
}: AuthButtonProps) {
  const reduceMotion = useReducedMotion();
  const isDisabled = disabled || loading;

  const className =
    variant === "secondary"
      ? "inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-white px-5 text-sm font-semibold text-dark shadow-soft transition hover:border-primary/25 hover:shadow-lift focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
      : "relative inline-flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(79,70,229,0.32)] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70";

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileHover={
        reduceMotion || isDisabled
          ? undefined
          : variant === "primary"
            ? { y: -2, scale: 1.02 }
            : { y: -2 }
      }
      whileTap={reduceMotion || isDisabled ? undefined : { scale: 0.98 }}
      className={className}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}
      <span className="relative">{loading ? "Please wait…" : children}</span>
    </motion.button>
  );
}
