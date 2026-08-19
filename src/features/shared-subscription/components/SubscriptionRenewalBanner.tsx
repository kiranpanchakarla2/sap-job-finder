"use client";

import { useEffect, useRef } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  MessageSquare,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type {
  AccountType,
  PaymentRequestRecord,
} from "../types/subscription.types";
import {
  getRenewalMilestone,
  getRenewalNotificationContent,
  type SubscriptionLike,
} from "../utils/renewalMilestones";
import { getSubscriptionDaysRemaining } from "../utils/dateCalculations";
import { isPaymentRequestExpired } from "../utils/paymentRequestUtils";
import { subscriptionNotificationService } from "../services/subscriptionNotificationService";

export interface SubscriptionRenewalBannerProps {
  accountType: AccountType;
  subscription: (SubscriptionLike & { id?: string }) | null | undefined;
  currentPlanName?: string;
  pendingPaymentRequest?: PaymentRequestRecord | null;
  canManage?: boolean;
  onRenew?: () => void;
  className?: string;
}

export function SubscriptionRenewalBanner({
  accountType,
  subscription,
  currentPlanName,
  pendingPaymentRequest,
  canManage = true,
  onRenew,
  className = "",
}: SubscriptionRenewalBannerProps) {
  const hasRecordedRef = useRef<string | null>(null);

  if (!subscription) return null;

  // Free plans with no expiration date do not show renewal banners
  if (
    subscription.planId === "free" &&
    !subscription.currentPeriodEnd &&
    !subscription.endDate &&
    subscription.status !== "expired"
  ) {
    return null;
  }

  const daysRemaining = getSubscriptionDaysRemaining(subscription);
  const milestone = getRenewalMilestone(subscription);

  // Check if an active non-expired pending or payment_link_sent payment request exists
  const hasActivePaymentRequest =
    Boolean(pendingPaymentRequest) &&
    (pendingPaymentRequest?.status === "pending" ||
      pendingPaymentRequest?.status === "payment_link_sent") &&
    !isPaymentRequestExpired(pendingPaymentRequest);

  const isExpiredPaymentRequest =
    Boolean(pendingPaymentRequest) &&
    (pendingPaymentRequest?.status === "pending" ||
      pendingPaymentRequest?.status === "payment_link_sent") &&
    isPaymentRequestExpired(pendingPaymentRequest);

  // Record milestone notification to database idempotently on mount
  useEffect(() => {
    if (!milestone || !subscription) return;
    const subId = subscription.id || `${accountType}-${subscription.planId || "sub"}`;
    const trackingKey = `${subId}:${milestone}`;

    if (hasRecordedRef.current === trackingKey) return;
    hasRecordedRef.current = trackingKey;

    void subscriptionNotificationService.recordNotification({
      subscriptionId: subId,
      accountType,
      milestone,
      notificationType:
        milestone === "expired"
          ? "subscription_expired"
          : "subscription_renewal",
    });
  }, [milestone, subscription, accountType]);

  // Case 1: Expired Payment Request Banner
  if (isExpiredPaymentRequest && pendingPaymentRequest) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`rounded-[var(--radius-card)] border border-slate-500/30 bg-slate-500/10 p-4 text-text shadow-soft ${className}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-500/20 text-slate-700 dark:text-slate-300">
              <AlertTriangle size={18} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Payment Request Expired
              </p>
              <p className="mt-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                This payment request is no longer valid. You can submit a new payment request.
              </p>
            </div>
          </div>

          {onRenew && canManage && (
            <div className="shrink-0">
              <Button
                type="button"
                onClick={onRenew}
                className="theme-btn-primary h-8 text-xs font-semibold"
              >
                <RefreshCw size={13} aria-hidden="true" className="mr-1.5" />
                Request New Payment
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Case 2: Active Subscription + Pending Renewal Payment Request
  if (hasActivePaymentRequest && pendingPaymentRequest) {
    const isPaymentLinkSent = pendingPaymentRequest.status === "payment_link_sent";
    return (
      <div
        role="status"
        aria-live="polite"
        className={`rounded-[var(--radius-card)] border border-amber-500/30 bg-amber-500/10 p-4 text-text shadow-soft ${className}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400">
              <Clock size={18} aria-hidden="true" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  {isPaymentLinkSent
                    ? "Payment Link Sent"
                    : "Renewal Payment Request Pending"}
                </p>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                  {pendingPaymentRequest.planName || pendingPaymentRequest.planId} ·{" "}
                  {pendingPaymentRequest.billingCycle}
                </span>
              </div>
              <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                {isPaymentLinkSent ? (
                  <>
                    Payment details have been sent to your WhatsApp contact at{" "}
                    <strong>{pendingPaymentRequest.whatsappNumber}</strong>. Your
                    current subscription remains active until its expiry date.
                  </>
                ) : (
                  <>
                    We’ve received your renewal request. We’ll contact you on WhatsApp with
                    the payment details. Your current subscription remains active until its
                    expiry date.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200">
              <MessageSquare size={13} aria-hidden="true" />
              {isPaymentLinkSent ? "Link Sent on WhatsApp" : "Awaiting Payment Details"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // If no renewal milestone applies and no pending request, render nothing
  if (!milestone) return null;

  const content = getRenewalNotificationContent(
    milestone,
    currentPlanName,
    false,
    daysRemaining,
  );

  // Case 3: Expired Subscription
  if (milestone === "expired") {
    return (
      <div
        role="alert"
        aria-live="polite"
        className={`rounded-[var(--radius-card)] border border-rose-500/30 bg-rose-500/10 p-4 text-text shadow-soft ${className}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-400">
              <AlertCircle size={18} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-900 dark:text-rose-100">
                {content.title}
              </p>
              <p className="mt-1 text-xs text-rose-800/90 dark:text-rose-200/90 leading-relaxed">
                {content.description}
              </p>
            </div>
          </div>

          {onRenew && canManage ? (
            <div className="shrink-0">
              <Button
                type="button"
                onClick={onRenew}
                className="theme-btn-primary h-8 text-xs font-semibold"
              >
                <ArrowRight size={13} aria-hidden="true" className="mr-1.5" />
                {content.ctaText}
              </Button>
            </div>
          ) : !canManage ? (
            <div className="shrink-0">
              <span className="text-[11px] font-medium text-rose-800 dark:text-rose-300">
                Contact Company Admin to renew
              </span>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // Case 4: Milestone Renewal Reminders (30-day, 14-day, 7-day, 1-day)
  const isUrgent = milestone === "1_day" || milestone === "7_day";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-[var(--radius-card)] border ${
        isUrgent
          ? "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100"
          : "border-sky-500/30 bg-sky-500/10 text-sky-950 dark:text-sky-100"
      } p-4 shadow-soft ${className}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              isUrgent
                ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                : "bg-sky-500/20 text-sky-700 dark:text-sky-300"
            }`}
          >
            {isUrgent ? (
              <AlertTriangle size={18} aria-hidden="true" />
            ) : (
              <Sparkles size={18} aria-hidden="true" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold">{content.title}</p>
            <p className="mt-1 text-xs opacity-90 leading-relaxed">
              {content.description}
            </p>
          </div>
        </div>

        {onRenew && canManage ? (
          <div className="shrink-0">
            <Button
              type="button"
              onClick={onRenew}
              className="theme-btn-primary h-8 text-xs font-semibold"
            >
              {content.ctaText}
              <ArrowRight size={13} aria-hidden="true" className="ml-1.5" />
            </Button>
          </div>
        ) : !canManage ? (
          <div className="shrink-0">
            <span className="text-[11px] font-medium opacity-80">
              Contact Company Admin to renew
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
