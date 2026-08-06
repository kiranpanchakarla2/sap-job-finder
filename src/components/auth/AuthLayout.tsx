"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { siteConfig } from "@/lib/constants";

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="pointer-events-none absolute inset-0 bg-gradient-soft opacity-90" />
      <div className="pointer-events-none absolute inset-0 opacity-50 grid-pattern" />
      <div className="pointer-events-none absolute left-[-8%] top-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl lg:hidden" />
      <div className="pointer-events-none absolute bottom-10 right-[-10%] h-72 w-72 rounded-full bg-accent/10 blur-3xl lg:hidden" />

      <div className="relative flex min-h-screen">
        <AuthBrandPanel />

        <div className="flex w-full flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:w-[45%]">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[430px]"
          >
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="mb-7 flex justify-center lg:mb-8"
            >
              <Link
                href="/"
                className="inline-flex items-center gap-2.5 rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                aria-label={`${siteConfig.name} home`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.3)]">
                  {siteConfig.logoMark}
                </span>
                <span className="text-[15px] font-semibold tracking-tight text-dark">
                  {siteConfig.name}
                </span>
              </Link>
            </motion.div>

            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
