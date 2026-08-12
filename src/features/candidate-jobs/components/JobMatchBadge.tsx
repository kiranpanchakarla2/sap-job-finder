"use client";

import type { MatchTier } from "../types/job.types";

const LABELS: Record<MatchTier, string> = {
  strong: "Strong Match",
  good: "Good Match",
  potential: "Potential Match",
};

const STYLES: Record<MatchTier, string> = {
  strong: "bg-emerald-500/10 text-emerald-700",
  good: "bg-primary/10 text-primary",
  potential: "bg-amber-500/10 text-amber-700",
};

export function JobMatchBadge({ tier }: { tier: MatchTier | null | undefined }) {
  if (!tier) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${STYLES[tier]}`}
    >
      {LABELS[tier]}
    </span>
  );
}
