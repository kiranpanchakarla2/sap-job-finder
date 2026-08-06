"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Lock } from "lucide-react";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { siteConfig } from "@/lib/constants";

type AuthShellProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
  footer: ReactNode;
  showSecurityBadge?: boolean;
};

export function AuthShell({
  children,
  title,
  subtitle,
  footer,
  showSecurityBadge = true,
}: AuthShellProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#eef2ff_48%,#ffffff_100%)]" />
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
              className="mb-7 flex flex-col items-center text-center lg:mb-8"
            >
              <Link
                href="/"
                className="mb-6 inline-flex items-center gap-2.5 rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-bold text-white shadow-[0_10px_24px_rgba(79,70,229,0.3)]">
                  G
                </span>
                <span className="text-[15px] font-semibold tracking-tight text-dark">
                  {siteConfig.name}
                </span>
              </Link>

              <h1 className="text-balance text-3xl font-bold tracking-tight text-dark sm:text-[2rem]">
                {title}
              </h1>
              <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-slate-500 sm:text-[15px]">
                {subtitle}
              </p>
            </motion.div>

            <div className="rounded-[24px] border border-white/70 bg-white/75 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">
              {children}

              {showSecurityBadge ? (
                <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-border/80 bg-surface/80 px-3.5 py-3">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                  <p className="text-xs leading-relaxed text-slate-500">
                    Your data is encrypted and never shared.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export { Divider as AuthDivider } from "@/components/auth/Divider";
