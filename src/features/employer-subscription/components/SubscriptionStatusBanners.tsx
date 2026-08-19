"use client";

import { Button } from "@/components/ui/Button";
import {
  SubscriptionRenewalBanner,
  getRenewalMilestone,
  type PaymentRequestRecord,
} from "@/features/shared-subscription";
import { daysUntil } from "../config/planRules";
import type { EmployerSubscription } from "../types/subscription.types";

export function SubscriptionStatusBanners({
  subscription,
  pendingPaymentRequest,
  canManage = true,
  onChoosePlan,
  onUpdateBilling,
}: {
  subscription: EmployerSubscription;
  pendingPaymentRequest?: PaymentRequestRecord | null;
  canManage?: boolean;
  onChoosePlan: () => void;
  onUpdateBilling: () => void;
}) {
  const milestone = getRenewalMilestone(subscription);

  // If a pending renewal request exists or a renewal milestone applies (30d, 14d, 7d, 1d, expired), show the renewal banner
  if (pendingPaymentRequest || milestone) {
    return (
      <SubscriptionRenewalBanner
        accountType="employer"
        subscription={subscription}
        pendingPaymentRequest={pendingPaymentRequest}
        canManage={canManage}
        onRenew={onChoosePlan}
      />
    );
  }


  if (subscription.status === "trialing") {
    const days = daysUntil(subscription.trialEndsAt);
    return (
      <div
        role="status"
        className="rounded-[var(--radius-card)] border border-sky-500/30 bg-sky-500/10 px-4 py-4"
      >
        <p className="text-sm font-medium text-text">
          Your Pro trial ends in {days ?? "a few"} days.
        </p>
        <div className="mt-3">
          <Button type="button" onClick={onChoosePlan}>
            Choose a Plan
          </Button>
        </div>
      </div>
    );
  }

  if (subscription.status === "past_due") {
    return (
      <div
        role="status"
        className="rounded-[var(--radius-card)] border border-warning/30 bg-warning/10 px-4 py-4"
      >
        <p className="text-sm font-medium text-text">
          Your subscription requires attention.
        </p>
        <div className="mt-3">
          <Button type="button" onClick={onUpdateBilling}>
            Update Billing
          </Button>
        </div>
      </div>
    );
  }

  if (subscription.status === "cancelled") {
    return (
      <div
        role="status"
        className="rounded-[var(--radius-card)] border border-error/30 bg-error/10 px-4 py-4"
      >
        <p className="text-sm font-medium text-text">
          Your subscription is cancelled.
        </p>
        <div className="mt-3">
          <Button type="button" onClick={onChoosePlan}>
            Choose a Plan
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
