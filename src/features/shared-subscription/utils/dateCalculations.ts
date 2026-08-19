import type { BillingCycle, SubscriptionStatus } from "../types/subscription.types";
import { getBillingDuration } from "../config/billingCycles";

/**
 * Calculates a subscription end date by adding calendar months according to the billing cycle.
 * Month-end dates are clamped safely (e.g. Jan 31 + 1 month => Feb 28 / Feb 29 in leap years).
 *
 * @param startDate Starting date (ISO string or Date instance)
 * @param billingCycle 'monthly' (1 mo), 'quarterly' (3 mo), or 'yearly' (12 mo)
 * @returns End date as Date instance
 */
export function calculateSubscriptionEndDate(
  startDate: Date | string,
  billingCycle: BillingCycle,
): Date {
  const start = typeof startDate === "string" ? new Date(startDate) : new Date(startDate);
  if (Number.isNaN(start.getTime())) {
    throw new Error(`Invalid start date provided: ${startDate}`);
  }

  const monthsToAdd = getBillingDuration(billingCycle);
  const targetYear = start.getFullYear();
  const targetMonth = start.getMonth() + monthsToAdd;
  const targetDay = start.getDate();

  // Create date at the 1st of the target month
  const target = new Date(targetYear, targetMonth, 1, start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds());
  
  // Find maximum days in the target month (e.g., 28/29 for Feb, 30 for Apr/Jun/Sep/Nov)
  const maxDaysInTargetMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  
  // Clamp day to max available days in target month
  target.setDate(Math.min(targetDay, maxDaysInTargetMonth));

  return target;
}

/**
 * Formats a Date or ISO string into 'YYYY-MM-DD' format.
 */
export function formatIsoDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Evaluates whether a subscription is currently active based on status, start date, and end date.
 * Active subscription condition:
 *   - status in ('active', 'trialing')
 *   - startDate <= now
 *   - endDate > now
 */
export function isSubscriptionActive(
  startDate: Date | string,
  endDate: Date | string | null | undefined,
  status: SubscriptionStatus,
  now: Date = new Date(),
): boolean {
  if (status !== "active" && status !== "trialing") {
    return false;
  }

  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  if (Number.isNaN(start.getTime()) || start.getTime() > now.getTime()) {
    return false;
  }

  if (!endDate) {
    return true;
  }

  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  if (Number.isNaN(end.getTime())) {
    return false;
  }

  return end.getTime() > now.getTime();
}

/**
 * Calculates remaining days until a given date.
 */
export function daysUntil(
  dateIso: string | Date | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!dateIso) return null;
  const target = typeof dateIso === "string" ? new Date(dateIso) : dateIso;
  if (Number.isNaN(target.getTime())) return null;
  const diffMs = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}
