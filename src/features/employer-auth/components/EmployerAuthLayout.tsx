"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EmployerAuthBrandPanel } from "./EmployerAuthBrandPanel";
import { EmployerAuthHeader } from "./EmployerAuthHeader";

type EmployerAuthLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
  footer?: ReactNode;
  maxWidthClassName?: string;
};

/**
 * Shared two-column employer authentication layout.
 * Desktop: brand panel + form. Mobile: stacked form-first experience.
 * Surfaces follow the active theme (palette + light/dark mode).
 */
export function EmployerAuthLayout({
  children,
  title,
  subtitle,
  footer,
  maxWidthClassName = "max-w-[430px]",
}: EmployerAuthLayoutProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen bg-surface text-text">
      <div className="relative flex min-h-screen">
        <EmployerAuthBrandPanel />

        <div className="relative flex w-full flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:w-[48%] xl:w-[45%]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_55%,transparent)_0%,color-mix(in_srgb,var(--primary)_8%,var(--surface))_48%,color-mix(in_srgb,var(--card)_40%,transparent)_100%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-30 grid-pattern" />
          <div className="pointer-events-none absolute left-[-8%] top-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl lg:hidden" />
          <div className="pointer-events-none absolute bottom-10 right-[-10%] h-72 w-72 rounded-full bg-accent/10 blur-3xl lg:hidden" />

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`relative z-10 w-full ${maxWidthClassName}`}
          >
            <EmployerAuthHeader title={title} subtitle={subtitle} />

            <div className="rounded-[24px] border border-border bg-card/95 p-6 shadow-soft backdrop-blur-xl sm:p-8">
              {children}
            </div>

            {footer ? (
              <div className="mt-6 text-center text-sm text-muted">{footer}</div>
            ) : null}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
