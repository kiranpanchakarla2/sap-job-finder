"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  BriefcaseBusiness,
  Building2,
  MapPin,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";

const floatBadges = [
  { label: "12,480+ roles", icon: TrendingUp, className: "left-0 top-[6%] sm:-left-4 lg:-left-8" },
  { label: "Remote friendly", icon: MapPin, className: "right-0 top-[10%] sm:-right-2 lg:-right-6" },
  { label: "SAP BTP", icon: Sparkles, className: "bottom-[28%] left-0 sm:-left-6" },
  { label: "94% match", icon: Star, className: "bottom-[8%] right-0 sm:-right-4" },
] as const;

const previewJobs = [
  {
    title: "SAP Commerce Developer",
    company: "Infosys",
    meta: "Hyderabad · Remote",
    salary: "₹20–28 LPA",
    logo: "I",
    highlight: true,
  },
  {
    title: "ABAP Specialist",
    company: "TCS",
    meta: "Bengaluru · Hybrid",
    salary: "₹16–22 LPA",
    logo: "T",
    highlight: false,
  },
  {
    title: "Fiori Consultant",
    company: "Accenture",
    meta: "Pune · Onsite",
    salary: "₹18–25 LPA",
    logo: "A",
    highlight: false,
  },
] as const;

function JobBoardPreview() {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-border/80 bg-card/95 shadow-lift backdrop-blur-sm">
      <div className="border-b border-border/70 bg-surface/90 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Recommended for you
            </p>
            <p className="mt-0.5 text-sm font-semibold text-text">Top SAP matches</p>
          </div>
          <span className="rounded-full bg-success/12 px-2.5 py-1 text-[11px] font-semibold text-success">
            Live
          </span>
        </div>
      </div>

      <div className="space-y-0 divide-y divide-border/70 p-2">
        {previewJobs.map((job) => (
          <div
            key={job.title}
            className={`flex items-start gap-3 rounded-[var(--radius-control)] p-3 transition ${
              job.highlight ? "bg-primary/[0.06]" : "hover:bg-surface/80"
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                job.highlight
                  ? "bg-primary text-button-fg shadow-[var(--shadow-button)]"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {job.logo}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text">{job.title}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                <Building2 size={12} />
                {job.company}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted">
                <span>{job.meta}</span>
                <span className="font-medium text-primary">{job.salary}</span>
              </div>
            </div>
            {job.highlight ? (
              <span className="shrink-0 rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                94%
              </span>
            ) : null}
          </div>
        ))}
      </div>

      <div className="border-t border-border/70 bg-surface/50 px-5 py-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          <BriefcaseBusiness size={14} className="text-primary" />
          <span>Updated daily from 2,100+ SAP hiring partners</span>
        </div>
      </div>
    </div>
  );
}

export function HeroVisual() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 36, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10"
      >
        <motion.div
          animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <JobBoardPreview />
        </motion.div>
      </motion.div>

      {floatBadges.map((badge, index) => {
        const Icon = badge.icon;
        return (
          <motion.div
            key={badge.label}
            initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: 0.35 + index * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={`absolute z-20 hidden sm:block ${badge.className}`}
          >
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, index % 2 === 0 ? -6 : 6, 0] }}
              transition={{
                duration: 4.5 + index * 0.35,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.25,
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-card/95 px-3 py-2 text-xs font-semibold text-text shadow-lift backdrop-blur-md"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              {badge.label}
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
