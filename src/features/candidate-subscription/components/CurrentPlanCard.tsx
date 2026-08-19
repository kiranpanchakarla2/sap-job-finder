"use client";

import { Calendar, CreditCard, RotateCcw, Settings, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCandidatePlanPrice } from "../config/planRules";
import type {
  CandidatePlanDefinition,
  CandidateSubscription,
  CandidateSubscriptionStatus,
} from "../types/subscription.types";

function formatDisplayDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(`${iso}T12:00:00`));
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: CandidateSubscriptionStatus }) {
  const config: Record<
    CandidateSubscriptionStatus,
    { label: string; bg: string; text: string }
  > = {
    pending: {
      label: "Pending",
      bg: "bg-amber-500/10 border-amber-500/20",
      text: "text-amber-700 dark:text-amber-400",
    },
    active: {
      label: "Active",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      text: "text-emerald-700 dark:text-emerald-400",
    },
    trialing: {
      label: "Trial",
      bg: "bg-primary/10 border-primary/20",
      text: "text-primary",
    },
    past_due: {
      label: "Payment Issue",
      bg: "bg-amber-500/10 border-amber-500/20",
      text: "text-amber-700 dark:text-amber-400",
    },
    cancelled: {
      label: "Cancelled",
      bg: "bg-rose-500/10 border-rose-500/20",
      text: "text-rose-700 dark:text-rose-400",
    },
    expired: {
      label: "Expired",
      bg: "bg-muted/20 border-muted/30",
      text: "text-muted",
    },
  };

  const current = config[status] ?? config.active;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${current.bg} ${current.text}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {current.label}
    </span>
  );
}

export function CurrentPlanCard({
  subscription,
  currentPlan,
  onManage,
  onReactivate,
  onExplorePlans,
}: {
  subscription: CandidateSubscription;
  currentPlan: CandidatePlanDefinition;
  onManage: () => void;
  onReactivate: () => void;
  onExplorePlans: () => void;
}) {
  const isPaidPlan = subscription.planId !== "free";
  const isCancelled = subscription.status === "cancelled" || subscription.cancelAtPeriodEnd;

  return (
    <section
      aria-labelledby="current-plan-heading"
      className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Current Plan Summary
            </p>
          </div>
          <h2 id="current-plan-heading" className="mt-2 text-2xl font-bold tracking-tight text-text">
            {currentPlan.name} Plan
          </h2>
          <p className="mt-1 text-sm text-muted">
            {currentPlan.tagline}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={subscription.status} />

          {isPaidPlan && !isCancelled && (
            <Button
              type="button"
              variant="secondary"
              onClick={onManage}
              className="inline-flex items-center gap-1.5 text-xs font-semibold h-9"
            >
              <Settings size={14} aria-hidden="true" />
              Manage Subscription
            </Button>
          )}

          {isPaidPlan && isCancelled && (
            <Button
              type="button"
              onClick={onReactivate}
              className="theme-btn-primary inline-flex items-center gap-1.5 text-xs font-semibold h-9"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Reactivate {currentPlan.name}
            </Button>
          )}

          {!isPaidPlan && (
            <Button
              type="button"
              onClick={onExplorePlans}
              className="theme-btn-primary inline-flex items-center gap-1.5 text-xs font-semibold h-9"
            >
              <CreditCard size={14} aria-hidden="true" />
              Upgrade Plan
            </Button>
          )}
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface/40 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Price & Billing
          </dt>
          <dd className="mt-1.5 flex items-baseline gap-1 text-base font-bold text-text">
            {formatCandidatePlanPrice(currentPlan.priceMonthly, currentPlan.currency)}
            <span className="text-xs font-medium text-muted">/month</span>
          </dd>
        </div>

        <div className="rounded-xl border border-border bg-surface/40 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            Billing Cycle
          </dt>
          <dd className="mt-1.5 text-base font-bold text-text capitalize">
            Monthly
          </dd>
        </div>

        <div className="rounded-xl border border-border bg-surface/40 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
            {isCancelled ? "Access Active Until" : "Next Renewal Date"}
          </dt>
          <dd className="mt-1.5 flex items-center gap-1.5 text-base font-bold text-text">
            <Calendar size={15} className="text-muted" aria-hidden="true" />
            {isCancelled
              ? formatDisplayDate(subscription.currentPeriodEnd)
              : formatDisplayDate(subscription.renewalDate ?? subscription.currentPeriodEnd)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
