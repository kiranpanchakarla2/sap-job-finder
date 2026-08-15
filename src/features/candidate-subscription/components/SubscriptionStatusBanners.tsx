"use client";

import { AlertCircle, AlertTriangle, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { CandidatePlanDefinition, CandidateSubscription } from "../types/subscription.types";

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

export function SubscriptionStatusBanners({
  subscription,
  currentPlan,
  onReactivate,
  onViewPlans,
}: {
  subscription: CandidateSubscription;
  currentPlan: CandidatePlanDefinition;
  onReactivate: () => void;
  onViewPlans: () => void;
}) {
  const isCancelled = subscription.status === "cancelled" || subscription.cancelAtPeriodEnd;
  const isPastDue = subscription.status === "past_due";
  const isExpired = subscription.status === "expired";

  if (isCancelled && subscription.planId !== "free") {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle
            size={18}
            className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
          <div>
            <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
              Subscription Ending Soon
            </p>
            <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
              Your {currentPlan.name} subscription will end on{" "}
              <strong className="font-semibold">{formatDisplayDate(subscription.currentPeriodEnd)}</strong>. You will not be charged again and will return to the Free plan.
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={onReactivate}
          className="theme-btn-primary shrink-0 self-start sm:self-auto text-xs font-semibold h-8"
        >
          <RotateCcw size={13} aria-hidden="true" />
          Reactivate {currentPlan.name}
        </Button>
      </div>
    );
  }

  if (isPastDue) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400"
            aria-hidden="true"
          />
          <div>
            <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
              Payment Issue · Action Required
            </p>
            <p className="mt-0.5 text-xs text-rose-800 dark:text-rose-300">
              We were unable to process your latest subscription payment. Your features remain active temporarily.
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={onViewPlans}
          className="shrink-0 self-start sm:self-auto text-xs font-semibold h-8 bg-rose-600 hover:bg-rose-700 text-white"
        >
          Review Plan
        </Button>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0 text-muted"
            aria-hidden="true"
          />
          <div>
            <p className="text-xs font-bold text-text">
              Your previous plan has expired
            </p>
            <p className="mt-0.5 text-xs text-muted">
              You are currently on the Free plan. Upgrade anytime to restore higher limits and advanced job-search tools.
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={onViewPlans}
          className="theme-btn-primary shrink-0 self-start sm:self-auto text-xs font-semibold h-8"
        >
          <ArrowRight size={13} aria-hidden="true" />
          View Plans
        </Button>
      </div>
    );
  }

  return null;
}
