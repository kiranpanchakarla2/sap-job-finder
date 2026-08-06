"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, FileDown, Sparkles, Star } from "lucide-react";
import { siteConfig } from "@/lib/constants";

const features = [
  "SAP-focused roles",
  "Profile & resume hub",
  "One-click apply",
  "Mock interview prep",
  "Company insights",
] as const;

const badges = [
  { label: "SAP Commerce", className: "left-0 top-[8%] sm:left-2" },
  { label: "ABAP & Fiori", className: "right-0 top-[18%] sm:right-2" },
  { label: "Top employers", className: "bottom-[22%] left-0 sm:left-0" },
  { label: "Remote ready", className: "bottom-[10%] right-0 sm:right-2" },
] as const;

function FloatingResume() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/60 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="h-3 w-28 rounded-full bg-dark/85" />
            <div className="mt-2 h-2 w-36 rounded-full bg-primary/40" />
          </div>
          <div className="space-y-1.5">
            <div className="ml-auto h-1.5 w-20 rounded-full bg-slate-200" />
            <div className="ml-auto h-1.5 w-16 rounded-full bg-slate-200" />
            <div className="ml-auto h-1.5 w-14 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-[1.4fr_0.9fr] gap-4 p-5">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="h-2 w-14 rounded-full bg-slate-300" />
            <div className="h-1.5 w-full rounded-full bg-slate-100" />
            <div className="h-1.5 w-[90%] rounded-full bg-slate-100" />
            <div className="h-1.5 w-[78%] rounded-full bg-slate-100" />
          </div>
          <div className="space-y-1.5">
            <div className="h-2 w-20 rounded-full bg-slate-300" />
            <div className="h-1.5 w-full rounded-full bg-slate-100" />
            <div className="h-1.5 w-[85%] rounded-full bg-slate-100" />
            <div className="h-1.5 w-[72%] rounded-full bg-slate-100" />
          </div>
        </div>
        <div className="space-y-3 border-l border-slate-100 pl-4">
          <div className="h-2 w-12 rounded-full bg-slate-300" />
          <div className="flex flex-wrap gap-1.5">
            {["PM", "GTM", "SQL"].map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary"
              >
                {skill}
              </span>
            ))}
          </div>
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-success text-[10px] font-bold text-white">
                98
              </span>
              <div>
                <div className="h-1.5 w-14 rounded-full bg-dark/40" />
                <div className="mt-1.5 h-1 w-10 rounded-full bg-slate-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthBrandPanel() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative hidden h-full min-h-screen overflow-hidden lg:flex lg:w-[55%] xl:w-[55%]">
      <motion.div
        className="absolute inset-0 bg-[linear-gradient(145deg,#312e81_0%,#4f46e5_38%,#7c3aed_72%,#1e1b4b_100%)]"
        animate={
          reduceMotion
            ? undefined
            : {
                backgroundPosition: ["0% 0%", "100% 50%", "0% 100%", "0% 0%"],
              }
        }
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        style={{ backgroundSize: "200% 200%" }}
      />

      <div className="pointer-events-none absolute inset-0 opacity-20 grid-pattern" />
      <div className="pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full bg-fuchsia-400/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-16 right-0 h-80 w-80 rounded-full bg-sky-300/25 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-indigo-200/20 blur-3xl" />

      {!reduceMotion
        ? Array.from({ length: 18 }).map((_, index) => (
            <motion.span
              key={index}
              className="pointer-events-none absolute h-1 w-1 rounded-full bg-white/70"
              style={{
                left: `${8 + ((index * 17) % 84)}%`,
                top: `${10 + ((index * 23) % 80)}%`,
              }}
              animate={{
                opacity: [0.15, 0.9, 0.15],
                y: [0, -12, 0],
                scale: [1, 1.4, 1],
              }}
              transition={{
                duration: 3.5 + (index % 5) * 0.4,
                repeat: Infinity,
                delay: index * 0.18,
                ease: "easeInOut",
              }}
            />
          ))
        : null}

      <div className="relative z-10 flex w-full flex-col justify-between px-10 py-12 xl:px-14 xl:py-14">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2.5 self-start rounded-2xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-md"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-sm font-bold text-primary">
            S
          </span>
          <span className="text-sm font-semibold text-white">{siteConfig.name}</span>
        </motion.div>

        <div className="my-10 max-w-xl">
          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-balance text-4xl font-bold tracking-tight text-white xl:text-5xl xl:leading-[1.1]"
          >
            Find Your Next SAP Career.
            <span className="mt-2 block text-indigo-100">Apply smarter across Commerce, ABAP, Fiori & more.</span>
          </motion.h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mt-5 max-w-md text-base leading-relaxed text-indigo-100/85"
          >
            Build your profile, upload your resume, and discover roles from top SAP hiring partners.
          </motion.p>

          <motion.ul
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
            className="mt-7 space-y-2.5"
          >
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2.5 text-sm font-medium text-white/95">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-emerald-300 backdrop-blur">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                {feature}
              </li>
            ))}
          </motion.ul>

          <div className="relative mx-auto mt-12 max-w-sm xl:max-w-md">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.65, delay: 0.3 }}
            >
              <motion.div
                animate={reduceMotion ? undefined : { y: [0, -12, 0] }}
                transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <FloatingResume />
              </motion.div>
            </motion.div>

            {badges.map((badge, index) => (
              <motion.div
                key={badge.label}
                className={`absolute z-20 ${badge.className}`}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 + index * 0.1, duration: 0.45 }}
              >
                <motion.div
                  animate={
                    reduceMotion
                      ? undefined
                      : { y: [0, index % 2 === 0 ? -8 : 8, 0] }
                  }
                  transition={{
                    duration: 4 + index * 0.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.25,
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white/90 px-3 py-2 text-xs font-semibold text-dark shadow-lift backdrop-blur-md"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary">
                    {index === 0 ? (
                      <Sparkles className="h-3 w-3" />
                    ) : index === 3 ? (
                      <FileDown className="h-3 w-3" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                  </span>
                  {badge.label}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md"
        >
          <p className="text-sm leading-relaxed text-indigo-50/95">
            “The SAP career network that helps professionals land their next role.”
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium text-indigo-100/80">
            <span className="inline-flex items-center gap-0.5 text-amber-300" aria-label="4.8 out of 5 stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
              <span className="ml-1.5 text-indigo-100">4.8/5</span>
            </span>
            <span className="h-1 w-1 rounded-full bg-white/40" aria-hidden="true" />
            <span>Built for SAP talent</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
