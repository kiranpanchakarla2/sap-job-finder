import type {
  AccountType,
  BasePlanDefinition,
  BillingCycle,
  PlanCurrency,
  SavingsCalculation,
} from "../types/subscription.types";
import { getBillingDuration } from "../config/billingCycles";

/**
 * Returns the exact price for a given plan and billing cycle.
 */
export function getPlanPrice(
  plan: Pick<BasePlanDefinition, "priceMonthly" | "priceQuarterly" | "priceYearly">,
  billingCycle: BillingCycle,
): number {
  if (billingCycle === "monthly") return plan.priceMonthly;
  if (billingCycle === "quarterly") return plan.priceQuarterly;
  if (billingCycle === "yearly") return plan.priceYearly;
  return plan.priceMonthly;
}

/**
 * Calculates savings for quarterly and yearly billing cycles compared to standard monthly rate.
 */
export function calculateSavings(
  monthlyPrice: number,
  cyclePrice: number,
  billingCycle: BillingCycle,
): SavingsCalculation {
  const durationMonths = getBillingDuration(billingCycle);
  const totalWithoutDiscount = monthlyPrice * durationMonths;
  const savings = Math.max(0, totalWithoutDiscount - cyclePrice);
  const monthlyEquivalent = durationMonths > 0 ? Math.round((cyclePrice / durationMonths) * 100) / 100 : cyclePrice;
  const discountPercentage = totalWithoutDiscount > 0 ? Math.round((savings / totalWithoutDiscount) * 100) : 0;

  return {
    billingCycle,
    monthlyPrice,
    cyclePrice,
    durationMonths,
    totalWithoutDiscount,
    savings,
    monthlyEquivalent,
    discountPercentage,
  };
}

/**
 * Formats a monetary value according to currency rules.
 */
export function formatCurrency(
  amount: number,
  currency: PlanCurrency = "INR",
): string {
  if (currency === "INR") {
    if (amount === 0) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
  }
  if (amount === 0) return "$0";
  return `$${amount.toLocaleString("en-US")}`;
}

/**
 * Verifies if a given plan matches the target account type (candidate vs employer).
 */
export function isPlanAvailableForAccountType(
  plan: Pick<BasePlanDefinition, "accountType">,
  accountType: AccountType,
): boolean {
  return plan.accountType === accountType;
}
