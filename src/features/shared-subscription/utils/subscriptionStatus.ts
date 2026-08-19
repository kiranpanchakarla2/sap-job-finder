import type {
  AccountType,
  BaseSubscriptionRecord,
  SubscriptionStatus,
} from "../types/subscription.types";
import { isSubscriptionActive } from "./dateCalculations";

/**
 * Determines the normalized subscription status given a subscription record and current time.
 */
export function getSubscriptionStatus(
  subscription: Pick<
    BaseSubscriptionRecord,
    "status" | "startDate" | "currentPeriodEnd"
  > | null | undefined,
  now: Date = new Date(),
): SubscriptionStatus {
  if (!subscription) {
    return "active"; // Free tier default is active
  }

  const rawStatus = subscription.status;

  if (rawStatus === "cancelled" || rawStatus === "past_due" || rawStatus === "pending") {
    return rawStatus;
  }

  const active = isSubscriptionActive(
    subscription.startDate,
    subscription.currentPeriodEnd,
    rawStatus,
    now,
  );

  if (!active && (rawStatus === "active" || rawStatus === "trialing")) {
    return "expired";
  }

  return rawStatus;
}

/**
 * Checks whether an active subscription already exists in the provided list to prevent duplicate active subscriptions.
 */
export function hasActiveSubscription(
  subscriptions: Array<
    Pick<BaseSubscriptionRecord, "status" | "startDate" | "currentPeriodEnd">
  >,
  now: Date = new Date(),
): boolean {
  return subscriptions.some((sub) => {
    const status = getSubscriptionStatus(sub, now);
    return status === "active" || status === "trialing";
  });
}

/**
 * Validates that an account type cannot select a disallowed plan.
 */
export function validatePlanForAccountType(
  planId: string,
  accountType: AccountType,
  allowedCandidatePlans: string[] = ["free", "professional", "premium"],
  allowedEmployerPlans: string[] = ["free", "pro", "business"],
): boolean {
  if (accountType === "candidate") {
    return allowedCandidatePlans.includes(planId);
  }
  if (accountType === "employer") {
    return allowedEmployerPlans.includes(planId);
  }
  return false;
}
