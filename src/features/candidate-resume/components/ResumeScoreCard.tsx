"use client";

import Link from "next/link";
import type { ResumeScoreInsight } from "../types/resume.types";

/**
 * UI placeholder for future resume analysis / AI scoring.
 * Consumes a ResumeScoreInsight so Phase 2+ can swap the mock source.
 */
export function ResumeScoreCard({
  insight,
}: {
  insight: ResumeScoreInsight;
}) {
  const clamped = Math.max(0, Math.min(100, insight.score));

  return (
    <section className="flex h-full flex-col rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-text">Resume Score</h2>
          <p className="mt-1 text-xs text-muted">{insight.label}</p>
        </div>
        <span className="text-2xl font-bold text-primary">{clamped}%</span>
      </div>

      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-surface"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Resume score"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>

      <p className="mt-4 flex-1 text-sm text-muted">{insight.tip}</p>

      <Link
        href="#career-profile"
        className="mt-4 inline-flex text-sm font-semibold text-primary transition hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 rounded"
      >
        Improve Resume
      </Link>
    </section>
  );
}
