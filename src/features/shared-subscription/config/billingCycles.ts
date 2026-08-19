import type {
  BillingCycle,
  BillingCycleMetadata,
} from "../types/subscription.types";

/**
 * Central registry of billing cycles across candidate and employer portals.
 */
export const BILLING_CYCLES: Record<BillingCycle, BillingCycleMetadata> = {
  monthly: {
    code: "monthly",
    displayName: "Monthly",
    durationMonths: 1,
    description: "Billed every month",
    tagline: "Standard monthly billing",
  },
  quarterly: {
    code: "quarterly",
    displayName: "Quarterly",
    durationMonths: 3,
    description: "Billed every 3 months",
    tagline: "Save ~10% with quarterly billing",
  },
  yearly: {
    code: "yearly",
    displayName: "Yearly",
    durationMonths: 12,
    description: "Billed once a year",
    tagline: "Save ~20% with annual billing",
  },
};

export const BILLING_CYCLE_LIST: BillingCycleMetadata[] = [
  BILLING_CYCLES.monthly,
  BILLING_CYCLES.quarterly,
  BILLING_CYCLES.yearly,
];

/**
 * Returns the duration in calendar months for the given billing cycle.
 */
export function getBillingDuration(billingCycle: BillingCycle): number {
  return BILLING_CYCLES[billingCycle]?.durationMonths ?? 1;
}

/**
 * Returns metadata descriptor for a billing cycle.
 */
export function getBillingCycleMetadata(
  billingCycle: BillingCycle,
): BillingCycleMetadata {
  return BILLING_CYCLES[billingCycle] ?? BILLING_CYCLES.monthly;
}

/**
 * Type guard for BillingCycle.
 */
export function isBillingCycle(value: unknown): value is BillingCycle {
  return (
    typeof value === "string" &&
    (value === "monthly" || value === "quarterly" || value === "yearly")
  );
}
