import { createClient } from "@/lib/supabase/client";
import type { PlanId } from "../types/subscription.types";
import type {
  EmployerSubscription,
  SubscriptionServiceResult,
  SubscriptionStatus,
} from "../types/subscription.types";

function isPlanId(value: string): value is PlanId {
  return value === "free" || value === "pro" || value === "business";
}

function isSubscriptionStatus(value: string): value is SubscriptionStatus {
  return (
    value === "active" ||
    value === "trialing" ||
    value === "past_due" ||
    value === "cancelled"
  );
}

/**
 * Subscription service backed by Supabase (plans + company subscription).
 * Talent Search usage = distinct searchable profile views in the current period.
 * Payment/billing remains out of scope (no Stripe).
 */
export const subscriptionService = {
  async getSubscription(
    _employerId?: string,
  ): Promise<SubscriptionServiceResult<EmployerSubscription>> {
    try {
      const supabase = createClient();

      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .select(
          "plan_id, status, billing_cycle, renewal_date, next_billing_date, trial_ends_at, payment_method_configured, current_period_start, current_period_end",
        )
        .maybeSingle();

      if (subError) {
        return { success: false, error: "Unable to load subscription." };
      }

      if (!subscription) {
        return { success: false, error: "No subscription found for this company." };
      }

      const planId = isPlanId(subscription.plan_id)
        ? subscription.plan_id
        : "free";
      const status = isSubscriptionStatus(subscription.status)
        ? subscription.status
        : "active";

      const [
        { count: activeJobs },
        { count: applications },
        { count: teamMembers },
        usageRpc,
      ] = await Promise.all([
        supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
        supabase
          .from("job_applications")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("employer_accounts")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
        supabase.rpc("get_talent_search_usage"),
      ]);

      let talentSearchUsed = 0;
      if (!usageRpc.error && usageRpc.data) {
        const row = usageRpc.data as { used?: unknown };
        if (typeof row.used === "number") {
          talentSearchUsed = row.used;
        }
      }

      return {
        success: true,
        data: {
          planId,
          status,
          renewalDate: subscription.renewal_date,
          trialEndsAt: subscription.trial_ends_at,
          billingCycle:
            subscription.billing_cycle === "yearly" ? "yearly" : "monthly",
          nextBillingDate: subscription.next_billing_date,
          paymentMethodConfigured: Boolean(
            subscription.payment_method_configured,
          ),
          usage: {
            activeJobs: activeJobs ?? 0,
            applications: applications ?? 0,
            talentSearch: talentSearchUsed,
            teamMembers: teamMembers ?? 0,
          },
          // Invoices require a billing provider — not implemented in Talent Search B.
          invoices: [],
        },
      };
    } catch {
      return {
        success: false,
        error: "Unable to load subscription.",
      };
    }
  },
};
