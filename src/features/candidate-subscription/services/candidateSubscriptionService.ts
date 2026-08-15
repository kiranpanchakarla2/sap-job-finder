import { createClient } from "@/lib/supabase/client";
import type {
  CandidatePlanDefinition,
  CandidatePlanId,
  CandidateSubscription,
  CandidateSubscriptionServiceResult,
  CandidateSubscriptionStatus,
} from "../types/subscription.types";
import {
  CANDIDATE_PLAN_DEFINITIONS,
  getCandidatePlanDefinition,
} from "../config/planRules";

const CANDIDATE_SUBSCRIPTION_STORAGE_KEY = "sapjobsfinder-candidate-subscription-v1";
const CANDIDATE_SIMULATE_ERROR_KEY = "sapjobsfinder-candidate-sub-error-v1";

function addDays(date: Date, days: number): string {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().split("T")[0] ?? "";
}

const DEFAULT_FREE_SUBSCRIPTION: CandidateSubscription = {
  planId: "free",
  status: "active",
  billingCycle: "monthly",
  priceMonthly: 0,
  currency: "INR",
  startDate: "2026-08-01",
  currentPeriodEnd: addDays(new Date(), 30),
  renewalDate: null,
  cancelAtPeriodEnd: false,
  usage: {
    applications: 0,
    jobAlerts: 0,
    savedJobs: 0,
    resumeVersions: 0,
  },
};

export const MOCK_PRESETS: Record<string, { label: string; data: CandidateSubscription }> = {
  FREE: {
    label: "Free Plan (Active)",
    data: {
      ...DEFAULT_FREE_SUBSCRIPTION,
      usage: { applications: 3, jobAlerts: 2, savedJobs: 5, resumeVersions: 1 },
    },
  },
  PROFESSIONAL_ACTIVE: {
    label: "Professional (Active)",
    data: {
      planId: "professional",
      status: "active",
      billingCycle: "monthly",
      priceMonthly: 499,
      currency: "INR",
      startDate: "2026-07-15",
      currentPeriodEnd: addDays(new Date(), 18),
      renewalDate: addDays(new Date(), 18),
      cancelAtPeriodEnd: false,
      usage: {
        applications: 12,
        jobAlerts: 4,
        savedJobs: 18,
        resumeVersions: 2,
      },
    },
  },
  PREMIUM_ACTIVE: {
    label: "Premium (Active)",
    data: {
      planId: "premium",
      status: "active",
      billingCycle: "monthly",
      priceMonthly: 999,
      currency: "INR",
      startDate: "2026-06-01",
      currentPeriodEnd: addDays(new Date(), 25),
      renewalDate: addDays(new Date(), 25),
      cancelAtPeriodEnd: false,
      usage: {
        applications: 38,
        jobAlerts: 12,
        savedJobs: 64,
        resumeVersions: 4,
      },
    },
  },
  PROFESSIONAL_CANCELLED: {
    label: "Professional (Cancelled - Ending Soon)",
    data: {
      planId: "professional",
      status: "cancelled",
      billingCycle: "monthly",
      priceMonthly: 499,
      currency: "INR",
      startDate: "2026-07-15",
      currentPeriodEnd: addDays(new Date(), 10),
      renewalDate: null,
      cancelAtPeriodEnd: true,
      usage: {
        applications: 14,
        jobAlerts: 4,
        savedJobs: 20,
        resumeVersions: 2,
      },
    },
  },
  PREMIUM_CANCELLED: {
    label: "Premium (Cancelled - Ending Soon)",
    data: {
      planId: "premium",
      status: "cancelled",
      billingCycle: "monthly",
      priceMonthly: 999,
      currency: "INR",
      startDate: "2026-06-01",
      currentPeriodEnd: addDays(new Date(), 12),
      renewalDate: null,
      cancelAtPeriodEnd: true,
      usage: {
        applications: 42,
        jobAlerts: 8,
        savedJobs: 40,
        resumeVersions: 3,
      },
    },
  },
  PAST_DUE: {
    label: "Professional (Past Due / Payment Issue)",
    data: {
      planId: "professional",
      status: "past_due",
      billingCycle: "monthly",
      priceMonthly: 499,
      currency: "INR",
      startDate: "2026-07-01",
      currentPeriodEnd: addDays(new Date(), 2),
      renewalDate: addDays(new Date(), 2),
      cancelAtPeriodEnd: false,
      usage: {
        applications: 19,
        jobAlerts: 5,
        savedJobs: 22,
        resumeVersions: 2,
      },
    },
  },
  EXPIRED: {
    label: "Expired (Returned to Free)",
    data: {
      planId: "free",
      status: "expired",
      billingCycle: "monthly",
      priceMonthly: 0,
      currency: "INR",
      startDate: "2026-05-01",
      currentPeriodEnd: addDays(new Date(), -5),
      renewalDate: null,
      cancelAtPeriodEnd: false,
      usage: {
        applications: 5,
        jobAlerts: 3,
        savedJobs: 15,
        resumeVersions: 1,
      },
    },
  },
};

function readStorage(): CandidateSubscription {
  if (typeof window === "undefined") return DEFAULT_FREE_SUBSCRIPTION;
  try {
    const raw = window.localStorage.getItem(CANDIDATE_SUBSCRIPTION_STORAGE_KEY);
    if (!raw) return DEFAULT_FREE_SUBSCRIPTION;
    const parsed = JSON.parse(raw) as CandidateSubscription;
    return parsed;
  } catch {
    return DEFAULT_FREE_SUBSCRIPTION;
  }
}

function writeStorage(data: CandidateSubscription): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CANDIDATE_SUBSCRIPTION_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota issues
  }
}

function shouldSimulateError(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CANDIDATE_SIMULATE_ERROR_KEY) === "true";
  } catch {
    return false;
  }
}

type SubscriptionOverviewRpcResult = {
  candidateId: string;
  effectivePlanId: CandidatePlanId;
  subscription: {
    id: string;
    planId: CandidatePlanId;
    status: CandidateSubscriptionStatus;
    billingCycle: "monthly" | "yearly";
    priceMonthly: number;
    currency: "INR";
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    renewalDate: string | null;
  } | null;
  plan: {
    id: CandidatePlanId;
    name: string;
    tagline: string;
    description: string;
    priceMonthly: number;
    currency: "INR";
    billingCycle: "monthly";
    badge?: string | null;
    highlighted?: boolean;
    features: string[];
    limits: {
      job_alerts?: number | null;
      saved_jobs?: number | null;
      applications_per_month?: number | null;
      resume_versions?: number | null;
    };
    featureFlags: string[];
  };
  usage: {
    jobAlerts: number;
    savedJobs: number;
    applications: number;
    resumeVersions: number;
  };
  plans?: Array<{
    id: CandidatePlanId;
    name: string;
    tagline: string;
    description: string;
    priceMonthly: number;
    currency: "INR";
    billingCycle: "monthly";
    badge?: string | null;
    highlighted?: boolean;
    features: string[];
    limits: {
      job_alerts?: number | null;
      saved_jobs?: number | null;
      applications_per_month?: number | null;
      resume_versions?: number | null;
    };
    featureFlags: string[];
    sortOrder: number;
  }>;
};

class CandidateSubscriptionService {
  /**
   * Loads candidate subscription, effective plan, and live usage counters from Supabase.
   */
  async getSubscription(): Promise<CandidateSubscriptionServiceResult<CandidateSubscription>> {
    if (shouldSimulateError()) {
      return { success: false, error: "Unable to load candidate subscription data." };
    }

    try {
      if (typeof window !== "undefined") {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();

        if (authData?.user) {
          const { data, error } = await supabase.rpc("get_candidate_subscription_overview");

          if (!error && data) {
            const overview = data as unknown as SubscriptionOverviewRpcResult;
            const sub = overview.subscription;
            const effectivePlanId = overview.effectivePlanId || (sub?.planId ?? "free");
            const planDef = getCandidatePlanDefinition(effectivePlanId);

            const result: CandidateSubscription = {
              planId: effectivePlanId,
              status: sub?.status ?? "active",
              billingCycle: "monthly",
              priceMonthly: sub?.priceMonthly ?? planDef.priceMonthly,
              currency: sub?.currency ?? planDef.currency,
              startDate: sub?.currentPeriodStart ?? "2026-08-01",
              currentPeriodEnd: sub?.currentPeriodEnd ?? addDays(new Date(), 30),
              renewalDate: sub?.renewalDate ?? null,
              cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
              usage: {
                applications: overview.usage?.applications ?? 0,
                jobAlerts: overview.usage?.jobAlerts ?? 0,
                savedJobs: overview.usage?.savedJobs ?? 0,
                resumeVersions: overview.usage?.resumeVersions ?? 0,
              },
            };

            writeStorage(result);
            return { success: true, data: result };
          }
        }
      }

      // Offline / unauthenticated / local fallback
      const current = readStorage();
      return { success: true, data: current };
    } catch {
      const current = readStorage();
      return { success: true, data: current };
    }
  }

  /**
   * Fetches centralized plans from Supabase (falling back to client config if offline).
   */
  async getPlans(): Promise<CandidateSubscriptionServiceResult<CandidatePlanDefinition[]>> {
    try {
      if (typeof window !== "undefined") {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("candidate_plans")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: CandidatePlanDefinition[] = data.map((row) => {
            const limitsRaw = (row.limits as Record<string, unknown>) ?? {};
            return {
              id: row.id as CandidatePlanId,
              name: row.name,
              tagline: row.tagline,
              priceMonthly: Number(row.price_monthly),
              currency: (row.currency as "INR") || "INR",
              billingPeriod: "month",
              description: row.description,
              badge: row.badge ?? undefined,
              highlighted: row.highlighted,
              features: Array.isArray(row.features) ? row.features : [],
              limits: {
                applicationsPerMonth:
                  limitsRaw.applications_per_month != null
                    ? Number(limitsRaw.applications_per_month)
                    : null,
                jobAlerts:
                  limitsRaw.job_alerts != null ? Number(limitsRaw.job_alerts) : null,
                savedJobs:
                  limitsRaw.saved_jobs != null ? Number(limitsRaw.saved_jobs) : null,
                resumeVersions:
                  limitsRaw.resume_versions != null
                    ? Number(limitsRaw.resume_versions)
                    : null,
              },
              featureFlags: Array.isArray(row.feature_flags)
                ? (row.feature_flags as CandidatePlanDefinition["featureFlags"])
                : [],
            };
          });
          return { success: true, data: mapped };
        }
      }
      return { success: true, data: CANDIDATE_PLAN_DEFINITIONS };
    } catch {
      return { success: true, data: CANDIDATE_PLAN_DEFINITIONS };
    }
  }

  /**
   * Upgrades the candidate plan (dev simulation via secure RPC in testing environment).
   */
  async upgradePlan(
    targetPlanId: CandidatePlanId,
  ): Promise<CandidateSubscriptionServiceResult<CandidateSubscription>> {
    if (shouldSimulateError()) {
      return { success: false, error: "Upgrade failed. Please try again." };
    }

    try {
      if (typeof window !== "undefined") {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();

        if (authData?.user) {
          const { data, error } = await supabase.rpc("dev_set_candidate_subscription", {
            p_plan_id: targetPlanId,
            p_status: "active",
            p_cancel_at_period_end: false,
            p_days_remaining: 30,
          });

          if (!error && data) {
            return this.getSubscription();
          }
        }
      }

      // Local storage fallback for dev/testing
      const current = readStorage();
      const plan = getCandidatePlanDefinition(targetPlanId);
      const updated: CandidateSubscription = {
        ...current,
        planId: targetPlanId,
        status: "active",
        priceMonthly: plan.priceMonthly,
        currency: plan.currency,
        renewalDate: addDays(new Date(), 30),
        currentPeriodEnd: addDays(new Date(), 30),
        cancelAtPeriodEnd: false,
      };
      writeStorage(updated);
      return { success: true, data: updated };
    } catch {
      return { success: false, error: "Upgrade failed. Please try again." };
    }
  }

  async switchPlan(
    targetPlanId: CandidatePlanId,
  ): Promise<CandidateSubscriptionServiceResult<CandidateSubscription>> {
    return this.upgradePlan(targetPlanId);
  }

  /**
   * Cancels subscription at period end.
   */
  async cancelSubscription(): Promise<CandidateSubscriptionServiceResult<CandidateSubscription>> {
    if (shouldSimulateError()) {
      return { success: false, error: "Cancellation failed. Please try again." };
    }

    try {
      const current = readStorage();
      if (typeof window !== "undefined") {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();

        if (authData?.user && current.planId !== "free") {
          const { data, error } = await supabase.rpc("dev_set_candidate_subscription", {
            p_plan_id: current.planId,
            p_status: "cancelled",
            p_cancel_at_period_end: true,
            p_days_remaining: 15,
          });

          if (!error && data) {
            return this.getSubscription();
          }
        }
      }

      const updated: CandidateSubscription = {
        ...current,
        status: "cancelled",
        cancelAtPeriodEnd: true,
        renewalDate: null,
      };
      writeStorage(updated);
      return { success: true, data: updated };
    } catch {
      return { success: false, error: "Cancellation failed. Please try again." };
    }
  }

  /**
   * Reactivates a cancelled subscription.
   */
  async reactivateSubscription(): Promise<CandidateSubscriptionServiceResult<CandidateSubscription>> {
    if (shouldSimulateError()) {
      return { success: false, error: "Reactivation failed. Please try again." };
    }

    try {
      const current = readStorage();
      if (typeof window !== "undefined") {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();

        if (authData?.user && current.planId !== "free") {
          const { data, error } = await supabase.rpc("dev_set_candidate_subscription", {
            p_plan_id: current.planId,
            p_status: "active",
            p_cancel_at_period_end: false,
            p_days_remaining: 30,
          });

          if (!error && data) {
            return this.getSubscription();
          }
        }
      }

      const updated: CandidateSubscription = {
        ...current,
        status: "active",
        cancelAtPeriodEnd: false,
        renewalDate: current.currentPeriodEnd,
      };
      writeStorage(updated);
      return { success: true, data: updated };
    } catch {
      return { success: false, error: "Reactivation failed. Please try again." };
    }
  }

  /**
   * Sets mock preset state for development/testing and applies to Supabase if authenticated.
   */
  async setMockPreset(presetKey: string): Promise<CandidateSubscriptionServiceResult<CandidateSubscription>> {
    const preset = MOCK_PRESETS[presetKey];
    if (!preset) {
      return { success: false, error: `Preset ${presetKey} not found` };
    }

    try {
      if (typeof window !== "undefined") {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();

        if (authData?.user) {
          const daysRemaining =
            preset.data.status === "expired"
              ? -5
              : preset.data.status === "past_due"
              ? 2
              : 20;

          await supabase.rpc("dev_set_candidate_subscription", {
            p_plan_id: preset.data.planId,
            p_status: preset.data.status,
            p_cancel_at_period_end: preset.data.cancelAtPeriodEnd,
            p_days_remaining: daysRemaining,
          });
        }
      }
    } catch {
      // Ignore RPC error in purely unit-test / offline environments
    }

    writeStorage(preset.data);
    return { success: true, data: preset.data };
  }

  setSimulateError(enabled: boolean): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(CANDIDATE_SIMULATE_ERROR_KEY, enabled ? "true" : "false");
    } catch {
      // Ignore
    }
  }

  isSimulatingError(): boolean {
    return shouldSimulateError();
  }
}

export const candidateSubscriptionService = new CandidateSubscriptionService();
