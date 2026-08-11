"use client";

import { Button } from "@/components/ui/Button";
import {
  buildUsageMetrics,
  getUsagePercentage,
  isAtLimit,
  isNearLimit,
} from "../config/planRules";
import type { EmployerSubscription } from "../types/subscription.types";

export function UsageCard({
  subscription,
  onUpgrade,
}: {
  subscription: EmployerSubscription;
  onUpgrade: () => void;
}) {
  const metrics = buildUsageMetrics(subscription);
  const activeJobs = metrics.find((metric) => metric.key === "activeJobs");
  const showNear =
    activeJobs && isNearLimit(activeJobs.used, activeJobs.limit);
  const showReached =
    activeJobs && isAtLimit(activeJobs.used, activeJobs.limit);

  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
      <h2 className="text-lg font-semibold text-text">Usage & Limits</h2>
      <p className="mt-1 text-sm text-muted">
        Track how your workspace is using plan capacity.
      </p>

      {showReached ? (
        <div
          role="status"
          className="mt-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3"
        >
          <p className="text-sm font-medium text-text">
            Your active job limit has been reached.
          </p>
          <div className="mt-3">
            <Button type="button" onClick={onUpgrade}>
              Upgrade Plan
            </Button>
          </div>
        </div>
      ) : showNear && activeJobs ? (
        <div
          role="status"
          className="mt-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3"
        >
          <p className="text-sm font-medium text-text">
            You&apos;ve used {activeJobs.used} of {activeJobs.limit} active job slots.
          </p>
          <div className="mt-3">
            <Button type="button" variant="secondary" onClick={onUpgrade}>
              Upgrade Plan
            </Button>
          </div>
        </div>
      ) : null}

      <ul className="mt-5 space-y-4">
        {metrics.map((metric) => {
          const percentage = getUsagePercentage(metric.used, metric.limit);
          const near = isNearLimit(metric.used, metric.limit);
          const at = isAtLimit(metric.used, metric.limit);
          const barTone = at
            ? "bg-error"
            : near
              ? "bg-warning"
              : "bg-primary";

          return (
            <li key={metric.key}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-text">{metric.label}</span>
                <span className="text-muted">
                  {metric.used}
                  {metric.limit === null
                    ? " / Unlimited"
                    : ` / ${metric.limit}`}
                  {percentage !== null ? ` (${percentage}%)` : null}
                </span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-surface"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percentage ?? 0}
                aria-label={`${metric.label} usage`}
              >
                <div
                  className={`h-full rounded-full ${barTone}`}
                  style={{
                    width:
                      metric.limit === null
                        ? "8%"
                        : `${percentage ?? 0}%`,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
