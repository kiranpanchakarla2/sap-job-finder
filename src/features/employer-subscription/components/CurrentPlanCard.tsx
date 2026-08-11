"use client";

import {
  buildUsageMetrics,
  formatPlanPrice,
  getPlanDefinition,
} from "../config/planRules";
import type { EmployerSubscription } from "../types/subscription.types";
import { PlanStatusBadge } from "./PlanStatusBadge";

function formatDisplayDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00`));
}

export function CurrentPlanCard({
  subscription,
}: {
  subscription: EmployerSubscription;
}) {
  const plan = getPlanDefinition(subscription.planId);
  const usage = buildUsageMetrics(subscription);

  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Current Plan
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-text">
            {plan.name.toUpperCase()}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {formatPlanPrice(plan.priceMonthly)}/{plan.billingPeriod}
          </p>
        </div>
        <PlanStatusBadge status={subscription.status} />
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
            Status
          </dt>
          <dd className="mt-1 text-sm font-medium text-text capitalize">
            {subscription.status.replace("_", " ")}
          </dd>
        </div>
        <div className="rounded-xl border border-border bg-surface/40 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
            Renewal
          </dt>
          <dd className="mt-1 text-sm font-medium text-text">
            {formatDisplayDate(subscription.renewalDate)}
          </dd>
        </div>
      </dl>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-text">Usage summary</h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {usage.map((metric) => (
            <li
              key={metric.key}
              className="rounded-xl border border-border bg-surface/40 px-3 py-3"
            >
              <p className="text-xs text-muted">{metric.label}</p>
              <p className="mt-1 text-sm font-semibold text-text">
                {metric.used}
                {metric.limit === null ? " / Unlimited" : ` / ${metric.limit}`}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
