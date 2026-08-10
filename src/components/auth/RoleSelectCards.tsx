"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  Star,
} from "lucide-react";

const features = [
  "SAP-focused roles",
  "Profile & resume hub",
  "One-click apply",
  "Mock interview prep",
  "Company insights",
] as const;

const modules = [
  "SAP Commerce",
  "ABAP & Fiori",
  "BTP",
  "FICO",
  "SuccessFactors",
  "Remote ready",
] as const;

export function RoleSelectCards({
  title,
  subtitle,
  mode,
}: {
  title: string;
  subtitle: string;
  mode: "login" | "register";
}) {
  const reduceMotion = useReducedMotion();
  const candidateHref = mode === "login" ? "/login/candidate" : "/register/candidate";
  const employerHref = mode === "login" ? "/employer/login" : "/employer/register";

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Primary action first — visible above the fold */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mx-auto max-w-2xl rounded-[28px] border border-border bg-card/90 p-5 shadow-lift backdrop-blur-xl sm:p-7"
      >
        <div className="mb-5 text-center sm:mb-6">
          <h1 className="text-xl font-bold tracking-tight text-dark sm:text-2xl">{title}</h1>
          <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          <article className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-border bg-gradient-to-br from-card via-card to-primary/5 p-5 transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-soft sm:p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
              <Briefcase size={22} aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-dark">Candidate</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">
              Find SAP jobs and grow your career with tailored matches across modules.
            </p>
            <Link
              href={candidateHref}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-4 text-sm font-semibold text-white shadow-soft transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              {mode === "login" ? "Candidate Login" : "Register as Candidate"}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </article>

          <article className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-border bg-gradient-to-br from-card via-card to-accent/5 p-5 transition hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-soft sm:p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent transition group-hover:bg-accent group-hover:text-white">
              <Building2 size={22} aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-dark">Employer</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">
              Find and hire SAP professionals ready for S/4HANA, BTP, and beyond.
            </p>
            <Link
              href={employerHref}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-text shadow-soft transition hover:border-accent/40 hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20"
            >
              {mode === "login" ? "Employer Login" : "Register as Employer"}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </article>
        </div>
      </motion.div>

      {/* Supporting content below the card */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
        className="mx-auto mt-8 max-w-3xl text-center"
      >
        <p className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Built for SAP talent
        </p>
        <h2 className="mx-auto mt-3 max-w-2xl text-balance text-2xl font-bold tracking-tight text-dark sm:text-3xl">
          Find Your Next SAP Career.
          <span className="mt-1 block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Apply smarter across Commerce, ABAP, Fiori & more.
          </span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
          Build your profile, upload your resume, and discover roles from top SAP hiring
          partners — or hire specialists who already speak your stack.
        </p>
      </motion.div>

      <motion.ul
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.12 }}
        className="mx-auto mt-5 flex max-w-3xl flex-wrap items-center justify-center gap-2"
      >
        {features.map((feature) => (
          <li
            key={feature}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-semibold text-text shadow-soft"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
              <Check className="h-3 w-3" aria-hidden="true" />
            </span>
            {feature}
          </li>
        ))}
      </motion.ul>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.16 }}
        className="mx-auto mt-5 flex max-w-2xl flex-wrap items-center justify-center gap-2"
      >
        {modules.map((module) => (
          <span
            key={module}
            className="rounded-xl border border-border/80 bg-white/70 px-3 py-1.5 text-xs font-semibold text-muted shadow-soft"
          >
            {module}
          </span>
        ))}
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2 }}
        className="mx-auto mt-6 max-w-2xl rounded-[22px] border border-border bg-gradient-to-r from-primary/95 via-primary to-accent p-5 text-white shadow-lift sm:p-6"
      >
        <p className="text-sm leading-relaxed text-white/95 sm:text-[15px]">
          “The SAP career network that helps professionals land their next role.”
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-medium text-indigo-100">
          <span
            className="inline-flex items-center gap-0.5 text-amber-300"
            aria-label="4.8 out of 5 stars"
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-current" />
            ))}
            <span className="ml-1.5 text-white">4.8/5</span>
          </span>
          <span className="h-1 w-1 rounded-full bg-white/40" aria-hidden="true" />
          <span>Trusted by SAP consultants & hiring teams</span>
        </div>
      </motion.div>
    </div>
  );
}
