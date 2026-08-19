import type { BillingCycle } from "@/features/shared-subscription";

export type CandidatePlanId = "free" | "professional" | "premium";

export type CandidatePlanCurrency = "INR";

export type CandidateSubscriptionStatus =
  | "pending"
  | "active"
  | "trialing"
  | "past_due"
  | "cancelled"
  | "expired";

export type CandidatePlanFeatureKey =
  | "job_search"
  | "basic_filters"
  | "advanced_search"
  | "applications"
  | "saved_jobs"
  | "job_alerts"
  | "resume_builder"
  | "ats_resume_score"
  | "multi_resume"
  | "application_tracking"
  | "application_insights"
  | "candidate_profile"
  | "profile_visibility"
  | "recruiter_messaging"
  | "direct_recruiter_reach"
  | "candidate_analytics"
  | "priority_support";

export type CandidatePlanLimits = {
  /** null = unlimited */
  applicationsPerMonth: number | null;
  jobAlerts: number | null;
  savedJobs: number | null;
  resumeVersions: number | null;
};

export type CandidatePlanDefinition = {
  id: CandidatePlanId;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceQuarterly?: number;
  priceYearly?: number;
  currency: CandidatePlanCurrency;
  billingPeriod: "month";
  description: string;
  badge?: string;
  highlighted?: boolean;
  features: string[];
  limits: CandidatePlanLimits;
  featureFlags: CandidatePlanFeatureKey[];
  accountType?: "candidate";
  displayOrder?: number;
};

export type CandidateUsageMetricKey =
  | "applications"
  | "jobAlerts"
  | "savedJobs"
  | "resumeVersions";

export type CandidateUsageMetric = {
  key: CandidateUsageMetricKey;
  label: string;
  used: number;
  /** null = unlimited */
  limit: number | null;
};

export type CandidateSubscription = {
  planId: CandidatePlanId;
  status: CandidateSubscriptionStatus;
  billingCycle: BillingCycle;
  price?: number;
  priceMonthly: number;
  currency: CandidatePlanCurrency;
  startDate: string;
  currentPeriodEnd: string;
  renewalDate: string | null;
  cancelAtPeriodEnd: boolean;
  usage: Record<CandidateUsageMetricKey, number>;
};

export type CandidateSubscriptionServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
