"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Briefcase, Check, Users } from "lucide-react";
import { siteConfig } from "@/lib/constants";

const features = [
  "Post SAP roles in minutes",
  "Review applicants in one pipeline",
  "Shortlist and schedule interviews",
  "Search SAP talent by module",
] as const;

/**
 * Left brand panel for employer auth.
 * Background / accents follow active theme tokens (palette + mode).
 */
export function EmployerAuthBrandPanel() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative hidden h-full min-h-screen overflow-hidden lg:flex lg:w-[52%] xl:w-[55%]">
      {/* Theme-driven brand wash */}
      <div
        className="absolute inset-0 bg-gradient-brand transition-[background] duration-300"
        style={{
          backgroundImage: `
            linear-gradient(
              155deg,
              color-mix(in srgb, var(--primary) 92%, #0b1220) 0%,
              var(--primary) 38%,
              var(--accent) 78%,
              color-mix(in srgb, var(--accent) 55%, #0b1220) 100%
            )
          `,
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,color-mix(in_srgb,var(--background)_18%,transparent)_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 grid-pattern" />
      <div className="pointer-events-none absolute -left-16 top-24 h-72 w-72 rounded-full bg-primary/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-0 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />

      <div className="relative z-10 flex w-full flex-col justify-between px-10 py-12 xl:px-14 xl:py-14">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 self-start rounded-2xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
            aria-label={`${siteConfig.name} home`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-900 shadow-soft">
              {siteConfig.logoMark}
            </span>
            <span className="text-sm font-semibold text-white">{siteConfig.name}</span>
          </Link>
        </motion.div>

        <div className="my-12 max-w-xl">
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="text-sm font-semibold uppercase tracking-[0.16em] text-white/75"
          >
            Employer workspace
          </motion.p>
          <motion.h2
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-3 text-balance text-4xl font-bold tracking-tight text-white xl:text-[2.75rem] xl:leading-[1.12]"
          >
            Hire SAP talent with a focused recruiting workspace.
          </motion.h2>
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="mt-5 max-w-md text-base leading-relaxed text-white/80"
          >
            Manage jobs, applicants, shortlists, and interviews — built for SAP hiring teams.
          </motion.p>

          <motion.ul
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="mt-8 space-y-3"
          >
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm font-medium text-white/95">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-white">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                {feature}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.28 }}
          className="grid max-w-md grid-cols-2 gap-3"
        >
          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
            <Briefcase className="h-4 w-4 text-white" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-white">Job pipeline</p>
            <p className="mt-1 text-xs leading-relaxed text-white/75">
              Post, manage, and track SAP roles in one place.
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
            <Users className="h-4 w-4 text-white" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-white">Applicant hub</p>
            <p className="mt-1 text-xs leading-relaxed text-white/75">
              Shortlist candidates and move hiring forward.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
