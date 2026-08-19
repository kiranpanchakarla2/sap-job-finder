import { createClient } from "@/lib/supabase/client";
import type {
  EmployerSubscription,
  PaymentRequestRecord,
  PlanDefinition,
  PlanId,
  SubscriptionServiceResult,
  SubscriptionStatus,
} from "../types/subscription.types";
import { PLAN_DEFINITIONS, PLAN_LIMITS, PLAN_FEATURES } from "../config/planRules";

function isPlanId(value: string): value is PlanId {
  return value === "free" || value === "pro" || value === "business";
}

function isSubscriptionStatus(value: string): value is SubscriptionStatus {
  return (
    value === "pending" ||
    value === "active" ||
    value === "trialing" ||
    value === "past_due" ||
    value === "cancelled" ||
    value === "expired"
  );
}

export type EmployerSubscriptionOverview = {
  subscription: EmployerSubscription;
  plans: PlanDefinition[];
  pendingPaymentRequest: PaymentRequestRecord | null;
};

/**
 * Subscription service backed by Supabase (plans + company subscription + pending requests).
 * Multi-billing cycle & manual payment request support (Sprint 9C).
 */
export const subscriptionService = {
  /**
   * Fetches the current company subscription & live usage metrics.
   * Preserved for backward compatibility with existing callers across employer portal.
   */
  async getSubscription(
    employerId?: string,
  ): Promise<SubscriptionServiceResult<EmployerSubscription>> {
    const overview = await this.getSubscriptionOverview(employerId);
    if (!overview.success) {
      return overview;
    }
    return {
      success: true,
      data: overview.data.subscription,
    };
  },

  /**
   * Fetches full subscription overview including plans and pending payment requests.
   */
  async getSubscriptionOverview(
    _employerId?: string,
  ): Promise<SubscriptionServiceResult<EmployerSubscriptionOverview>> {
    try {
      const supabase = createClient();

      const [
        subRes,
        activeJobsRes,
        appsRes,
        teamRes,
        usageRpcRes,
        pendingReqRes,
        plansRes,
      ] = await Promise.all([
        supabase
          .from("subscriptions")
          .select(
            "plan_id, status, billing_cycle, price, renewal_date, next_billing_date, trial_ends_at, payment_method_configured, current_period_start, current_period_end",
          )
          .maybeSingle(),
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
        supabase
          .from("payment_requests")
          .select("*")
          .eq("account_type", "employer")
          .in("status", ["pending", "payment_link_sent"])
          .order("requested_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("subscription_plans")
          .select("*")
          .eq("account_type", "employer")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      ]);

      if (subRes.error) {
        return { success: false, error: "Unable to load subscription information." };
      }

      const subscriptionRow = subRes.data;

      const planId: PlanId = subscriptionRow && isPlanId(subscriptionRow.plan_id)
        ? subscriptionRow.plan_id
        : "free";

      const status: SubscriptionStatus = subscriptionRow && isSubscriptionStatus(subscriptionRow.status)
        ? subscriptionRow.status
        : "active";

      let talentSearchUsed = 0;
      if (!usageRpcRes.error && usageRpcRes.data) {
        const row = usageRpcRes.data as { used?: unknown };
        if (typeof row.used === "number") {
          talentSearchUsed = row.used;
        }
      }

      const billingCycle =
        subscriptionRow?.billing_cycle === "yearly"
          ? "yearly"
          : subscriptionRow?.billing_cycle === "quarterly"
          ? "quarterly"
          : "monthly";

      const subscription: EmployerSubscription = {
        planId,
        status,
        price: subscriptionRow?.price ? Number(subscriptionRow.price) : undefined,
        renewalDate: subscriptionRow?.renewal_date ?? null,
        trialEndsAt: subscriptionRow?.trial_ends_at ?? null,
        billingCycle,
        nextBillingDate: subscriptionRow?.next_billing_date ?? null,
        paymentMethodConfigured: Boolean(subscriptionRow?.payment_method_configured),
        usage: {
          activeJobs: activeJobsRes.count ?? 0,
          applications: appsRes.count ?? 0,
          talentSearch: talentSearchUsed,
          teamMembers: teamRes.count ?? 0,
        },
        invoices: [],
      };

      // Map plans from DB or fallback to PLAN_DEFINITIONS
      let plans: PlanDefinition[] = PLAN_DEFINITIONS;
      if (plansRes.data && plansRes.data.length > 0) {
        plans = plansRes.data.map((row) => {
          const id = (row.id as PlanId) || "free";
          const fallback = PLAN_DEFINITIONS.find((p) => p.id === id);
          return {
            id,
            name: row.name || fallback?.name || id,
            priceMonthly: Number(row.price_monthly ?? 0),
            priceQuarterly: Number(row.price_quarterly ?? (Number(row.price_monthly ?? 0) * 3)),
            priceYearly: Number(row.price_yearly ?? (Number(row.price_monthly ?? 0) * 12)),
            currency: (row.currency as PlanDefinition["currency"]) || "INR",
            billingPeriod: "month",
            description: row.description || fallback?.description || "",
            features: fallback?.features || [],
            limits: PLAN_LIMITS[id] || fallback?.limits || PLAN_LIMITS.free,
            featureFlags: PLAN_FEATURES[id] || fallback?.featureFlags || [],
            highlighted: id === "pro",
            badge: id === "pro" ? "Most Popular" : id === "business" ? "Best Value" : undefined,
            accountType: "employer",
            displayOrder: row.sort_order ?? fallback?.displayOrder ?? 1,
            isActive: row.is_active ?? true,
          };
        });
      }

      // Map pending payment request if exists
      let pendingPaymentRequest: PaymentRequestRecord | null = null;
      if (pendingReqRes.data) {
        const p = pendingReqRes.data;
        pendingPaymentRequest = {
          id: p.id,
          accountType: "employer",
          userId: p.user_id,
          companyId: p.company_id,
          planId: p.plan_id,
          planName: p.plan_name,
          billingCycle: p.billing_cycle,
          amount: Number(p.amount),
          currency: (p.currency as PlanDefinition["currency"]) || "INR",
          customerName: p.customer_name,
          email: p.email,
          whatsappNumber: p.whatsapp_number,
          companyName: p.company_name,
          status: p.status,
          notes: p.notes,
          paymentLink: p.payment_link,
          requestedAt: p.requested_at,
          expiresAt: p.expires_at,
          paymentLinkSentAt: p.payment_link_sent_at,
          paymentReceivedAt: p.payment_received_at,
          cancelledAt: p.cancelled_at,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        };
      }

      return {
        success: true,
        data: {
          subscription,
          plans,
          pendingPaymentRequest,
        },
      };
    } catch {
      return {
        success: false,
        error: "Unable to load subscription information.",
      };
    }
  },
};
