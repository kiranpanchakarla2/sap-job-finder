"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { siteConfig } from "@/lib/constants";

type FullWidthAuthLayoutProps = {
  children: ReactNode;
};

/**
 * Full-viewport auth shell without the split brand panel.
 * Used for role selection (/login, /register) and nested auth forms.
 */
export function FullWidthAuthLayout({ children }: FullWidthAuthLayoutProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(79,70,229,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(124,58,237,0.10),_transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-soft opacity-70" />
      <div className="pointer-events-none absolute inset-0 opacity-35 grid-pattern" />
      <div className="pointer-events-none absolute -left-24 top-0 h-[28rem] w-[28rem] rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-[26rem] w-[26rem] rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-300/10 blur-3xl" />

      {!reduceMotion
        ? Array.from({ length: 12 }).map((_, index) => (
            <motion.span
              key={index}
              className="pointer-events-none absolute h-1 w-1 rounded-full bg-primary/40"
              style={{
                left: `${10 + ((index * 19) % 80)}%`,
                top: `${12 + ((index * 27) % 70)}%`,
              }}
              animate={{
                opacity: [0.15, 0.7, 0.15],
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3.8 + (index % 4) * 0.4,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut",
              }}
            />
          ))
        : null}

      <div className="relative flex min-h-screen flex-col items-center justify-start px-5 pb-12 pt-8 sm:px-8 sm:pb-16 sm:pt-10">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          <div className="mb-5 flex justify-center sm:mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-2xl border border-border/70 bg-card/80 px-3 py-2 shadow-soft backdrop-blur-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              aria-label={`${siteConfig.name} home`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.3)]">
                {siteConfig.logoMark}
              </span>
              <span className="pr-1 text-[15px] font-semibold tracking-tight text-dark">
                {siteConfig.name}
              </span>
            </Link>
          </div>

          {children}
        </motion.div>
      </div>
    </div>
  );
}
