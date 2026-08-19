import type {
  RenewalMilestone,
  RenewalNotificationContent,
  SubscriptionStatus,
} from "../types/subscription.types";
import { getSubscriptionDaysRemaining } from "./dateCalculations";

export interface SubscriptionLike {
  planId?: string;
  status?: SubscriptionStatus | string;
  currentPeriodEnd?: string | null;
  endDate?: string | null;
  renewalDate?: string | null;
  trialEndsAt?: string | null;
  cancelAtPeriodEnd?: boolean;
}

/**
 * Maps remaining calendar days to the single current applicable renewal milestone.
 * Milestone windows:
 *   - <= 0 days or status === 'expired' -> 'expired'
 *   - 1 day -> '1_day'
 *   - 2 to 7 days -> '7_day'
 *   - 8 to 14 days -> '14_day'
 *   - 15 to 30 days -> '30_day'
 *   - > 30 days -> null
 */
export function getRenewalMilestone(
  subscriptionOrEndDate: SubscriptionLike | string | Date | null | undefined,
  now: Date = new Date(),
): RenewalMilestone | null {
  if (!subscriptionOrEndDate) return null;

  // If object has status = 'expired'
  if (
    typeof subscriptionOrEndDate === "object" &&
    !(subscriptionOrEndDate instanceof Date) &&
    subscriptionOrEndDate.status === "expired"
  ) {
    return "expired";
  }

  // Free plans with no explicit expiration do not trigger renewal milestones
  if (
    typeof subscriptionOrEndDate === "object" &&
    !(subscriptionOrEndDate instanceof Date) &&
    subscriptionOrEndDate.planId === "free" &&
    !subscriptionOrEndDate.currentPeriodEnd &&
    !subscriptionOrEndDate.endDate
  ) {
    return null;
  }

  const daysRemaining = getSubscriptionDaysRemaining(subscriptionOrEndDate, now);
  if (daysRemaining === null) return null;

  if (daysRemaining <= 0) {
    return "expired";
  }
  if (daysRemaining === 1) {
    return "1_day";
  }
  if (daysRemaining <= 7) {
    return "7_day";
  }
  if (daysRemaining <= 14) {
    return "14_day";
  }
  if (daysRemaining <= 30) {
    return "30_day";
  }

  return null;
}

/**
 * Returns exact user-facing copy and display metadata for a renewal milestone.
 */
export function getRenewalNotificationContent(
  milestone: RenewalMilestone,
  planName?: string,
  isRenewalPending?: boolean,
  daysRemainingOverride?: number | null,
): RenewalNotificationContent {
  if (isRenewalPending) {
    return {
      milestone,
      title: "Renewal Payment Request Pending",
      description:
        "We've received your renewal request. We'll contact you with payment details. Your current subscription remains active until its expiry date.",
      ctaText: "View Request",
      daysRemaining: daysRemainingOverride ?? null,
      variant: "pending",
      isExpired: false,
    };
  }

  switch (milestone) {
    case "30_day":
      return {
        milestone: "30_day",
        title: "Your subscription expires in 30 days.",
        description: "Renew early to continue uninterrupted access.",
        ctaText: "Renew Subscription",
        daysRemaining: daysRemainingOverride ?? 30,
        variant: "info",
        isExpired: false,
      };

    case "14_day":
      return {
        milestone: "14_day",
        title: "Your subscription expires in 14 days.",
        description: "Renew your subscription to continue uninterrupted access.",
        ctaText: "Renew Subscription",
        daysRemaining: daysRemainingOverride ?? 14,
        variant: "info",
        isExpired: false,
      };

    case "7_day":
      return {
        milestone: "7_day",
        title: "Your subscription expires in 7 days.",
        description: "Renew now to avoid interruption.",
        ctaText: "Renew Subscription",
        daysRemaining: daysRemainingOverride ?? 7,
        variant: "warning",
        isExpired: false,
      };

    case "1_day":
      return {
        milestone: "1_day",
        title: "Your subscription expires tomorrow.",
        description: "Renew now to keep your premium access.",
        ctaText: "Renew Subscription",
        daysRemaining: daysRemainingOverride ?? 1,
        variant: "warning",
        isExpired: false,
      };

    case "expired":
      return {
        milestone: "expired",
        title: "Your subscription has expired.",
        description: "Renew your subscription to regain access to premium features.",
        ctaText: "Renew Subscription",
        daysRemaining: 0,
        variant: "error",
        isExpired: true,
      };
  }
}

/**
 * Determines whether a renewal reminder notification should be shown in the UI.
 */
export function shouldShowRenewalNotification(
  subscription: SubscriptionLike | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!subscription) return false;

  // Never show for free plans without expiry
  if (subscription.planId === "free" && !subscription.currentPeriodEnd && !subscription.endDate) {
    return false;
  }

  // Cancelled subscriptions are handled by cancellation banner unless also nearing end
  const milestone = getRenewalMilestone(subscription, now);
  return milestone !== null;
}
