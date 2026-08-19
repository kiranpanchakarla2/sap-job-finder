"use client";

import { Sparkles, Zap } from "lucide-react";
import type { BillingCycle } from "../types/subscription.types";

export interface BillingPeriodSelectorProps {
  selectedCycle: BillingCycle;
  onSelectCycle: (cycle: BillingCycle) => void;
  className?: string;
}

const CYCLES: Array<{
  id: BillingCycle;
  label: string;
  badge?: {
    text: string;
    icon?: typeof Sparkles;
    tone: "primary" | "emerald";
  };
}> = [
  {
    id: "monthly",
    label: "Monthly",
  },
  {
    id: "quarterly",
    label: "Quarterly",
    badge: {
      text: "Most Popular",
      icon: Sparkles,
      tone: "primary",
    },
  },
  {
    id: "yearly",
    label: "Yearly",
    badge: {
      text: "Best Value",
      icon: Zap,
      tone: "emerald",
    },
  },
];

export function BillingPeriodSelector({
  selectedCycle,
  onSelectCycle,
  className = "",
}: BillingPeriodSelectorProps) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div
        role="radiogroup"
        aria-label="Choose your billing period"
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/80 p-1.5 shadow-xs backdrop-blur-xs"
      >
        {CYCLES.map((cycle) => {
          const isSelected = selectedCycle === cycle.id;
          const BadgeIcon = cycle.badge?.icon;

          return (
            <button
              key={cycle.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectCycle(cycle.id)}
              className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                isSelected
                  ? "bg-primary text-white shadow-sm ring-1 ring-primary/40"
                  : "text-muted hover:text-text hover:bg-surface-elevated/60"
              }`}
            >
              <span>{cycle.label}</span>

              {cycle.badge && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase transition-colors ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : cycle.badge.tone === "emerald"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : "bg-primary/15 text-primary"
                  }`}
                >
                  {BadgeIcon && <BadgeIcon size={11} aria-hidden="true" />}
                  {cycle.badge.text}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
