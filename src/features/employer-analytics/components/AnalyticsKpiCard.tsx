"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { AnalyticsKpi } from "../types/analytics.types";
import { formatRate } from "../lib/calculations";

export function AnalyticsKpiCard({ kpi }: { kpi: AnalyticsKpi }) {
  const displayValue =
    kpi.key === "hireRate" ? formatRate(kpi.value) : kpi.value.toLocaleString();

  const TrendIcon =
    kpi.trendDirection === "up"
      ? TrendingUp
      : kpi.trendDirection === "down"
        ? TrendingDown
        : Minus;

  const trendTone =
    kpi.trendDirection === "up"
      ? "text-success"
      : kpi.trendDirection === "down"
        ? "text-error"
        : "text-muted";

  return (
    <article className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
      <p className="text-sm text-muted">{kpi.label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-text">{displayValue}</p>
      {kpi.trend ? (
        <p className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${trendTone}`}>
          <TrendIcon size={14} aria-hidden="true" />
          <span>
            {kpi.trend}
            {kpi.trendLabel ? (
              <span className="font-normal text-muted"> {kpi.trendLabel}</span>
            ) : null}
          </span>
        </p>
      ) : null}
    </article>
  );
}
