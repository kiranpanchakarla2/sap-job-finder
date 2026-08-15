"use client";

import { Activity, AlertTriangle, CheckCircle2, Infinity as InfinityIcon } from "lucide-react";
import { getUsagePercentage, isAtLimit, isNearLimit } from "../config/planRules";
import type { CandidateUsageMetric } from "../types/subscription.types";

export function UsageCard({
  usage,
  planName = "Professional",
  onUpgrade,
  showUpgradeHint = true,
}: {
  usage: CandidateUsageMetric[];
  planName?: string;
  onUpgrade?: () => void;
  showUpgradeHint?: boolean;
}) {
  const hasLimitWarning = usage.some(
    (item) => item.limit !== null && isNearLimit(item.used, item.limit),
  );
  const hasAtLimit = usage.some(
    (item) => item.limit !== null && isAtLimit(item.used, item.limit),
  );

  return (
    <section
      aria-labelledby="usage-card-heading"
      className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-primary" aria-hidden="true" />
            <h2 id="usage-card-heading" className="text-lg font-bold tracking-tight text-text">
              Plan Usage
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted">
            Track your candidate job-search activity and monthly resource limits.
          </p>
        </div>

        {showUpgradeHint && (hasAtLimit || hasLimitWarning) && onUpgrade && (
          <button
            type="button"
            onClick={onUpgrade}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 transition"
          >
            <AlertTriangle size={14} aria-hidden="true" />
            <span>Nearing limits · Upgrade Plan</span>
          </button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {usage.map((metric) => {
          const isUnlimited = metric.limit === null;
          const percentage = isUnlimited ? null : getUsagePercentage(metric.used, metric.limit);
          const reachedLimit = !isUnlimited && isAtLimit(metric.used, metric.limit);
          const nearLimit = !isUnlimited && isNearLimit(metric.used, metric.limit);

          return (
            <div
              key={metric.key}
              className={`flex flex-col justify-between rounded-xl border p-4 transition ${
                reachedLimit
                  ? "border-rose-500/30 bg-rose-500/5"
                  : nearLimit
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-border bg-surface/40"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-muted truncate">{metric.label}</p>
                  {isUnlimited ? (
                    <span
                      title="Unlimited on your plan"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400"
                    >
                      <CheckCircle2 size={13} aria-hidden="true" />
                      Unlimited
                    </span>
                  ) : reachedLimit ? (
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                      Limit reached
                    </span>
                  ) : nearLimit ? (
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      Almost full
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-text">
                    {metric.used}
                  </span>
                  <span className="text-xs text-muted">
                    {isUnlimited ? "used" : `of ${metric.limit} used`}
                  </span>
                </div>

                {reachedLimit && (
                  <p className="mt-1.5 text-[11px] font-medium text-rose-600 dark:text-rose-400 leading-tight">
                    You&apos;ve reached your {planName} plan limit of {metric.limit} {metric.label.toLowerCase()}.
                  </p>
                )}
              </div>

              <div className="mt-4">
                {isUnlimited ? (
                  <div className="h-1.5 w-full rounded-full bg-emerald-500/20">
                    <div className="h-1.5 w-full rounded-full bg-emerald-500" />
                  </div>
                ) : (
                  <div
                    role="progressbar"
                    aria-valuenow={metric.used}
                    aria-valuemin={0}
                    aria-valuemax={metric.limit ?? 100}
                    aria-label={`${metric.label} usage`}
                    className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover"
                  >
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        reachedLimit
                          ? "bg-rose-500"
                          : nearLimit
                          ? "bg-amber-500"
                          : "bg-primary"
                      }`}
                      style={{ width: `${percentage ?? 0}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
