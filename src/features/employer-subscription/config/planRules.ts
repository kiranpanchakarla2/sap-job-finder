import type {
  EmployerSubscription,
  PlanDefinition,
  PlanEntitlement,
  PlanFeature,
  PlanId,
  PlanLimits,
  UsageMetric,
  UsageMetricKey,
} from "../types/subscription.types";

const ENTITLEMENT_TO_FEATURE: Record<PlanEntitlement, PlanFeature> = {
  talentSearch: "talent_search",
  advancedAnalytics: "advanced_analytics",
  teamManagement: "team_members",
  bulkUpload: "bulk_upload",
};

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    activeJobs: 5,
    applications: 50,
    talentSearch: 10,
    teamMembers: 1,
  },
  pro: {
    activeJobs: 25,
    applications: 500,
    talentSearch: 100,
    teamMembers: 5,
  },
  business: {
    activeJobs: null,
    applications: null,
    talentSearch: null,
    teamMembers: null,
  },
};

export const PLAN_FEATURES: Record<PlanId, PlanFeature[]> = {
  free: [
    "basic_analytics",
    "candidate_messaging",
    "interview_management",
  ],
  pro: [
    "basic_analytics",
    "advanced_analytics",
    "talent_search",
    "candidate_messaging",
    "interview_management",
    "bulk_upload",
  ],
  business: [
    "basic_analytics",
    "advanced_analytics",
    "talent_search",
    "candidate_messaging",
    "interview_management",
    "team_members",
    "priority_support",
    "bulk_upload",
  ],
};

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceQuarterly: 0,
    priceYearly: 0,
    currency: "INR",
    billingPeriod: "month",
    description: "Get started with essential hiring tools.",
    features: [
      "5 active jobs",
      "Basic applicant management",
      "Basic analytics",
      "Interview scheduling",
      "Candidate messaging",
    ],
    limits: PLAN_LIMITS.free,
    featureFlags: PLAN_FEATURES.free,
    accountType: "employer",
    displayOrder: 1,
    isActive: true,
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 1999,
    priceQuarterly: 5399,
    priceYearly: 19199,
    currency: "INR",
    billingPeriod: "month",
    description: "Scale hiring with advanced insights and Talent Search.",
    features: [
      "25 active jobs",
      "Bulk Job Upload (Excel)",
      "Advanced analytics",
      "Talent Search",
      "Candidate messaging",
      "Interview management",
      "Priority features",
    ],
    limits: PLAN_LIMITS.pro,
    featureFlags: PLAN_FEATURES.pro,
    highlighted: true,
    badge: "Most Popular",
    accountType: "employer",
    displayOrder: 2,
    isActive: true,
  },
  {
    id: "business",
    name: "Business",
    priceMonthly: 5999,
    priceQuarterly: 16199,
    priceYearly: 57599,
    currency: "INR",
    billingPeriod: "month",
    description: "Unlimited hiring capacity for growing teams.",
    features: [
      "Unlimited active jobs",
      "Bulk Job Upload (Excel)",
      "Advanced analytics",
      "Talent Search",
      "Team capabilities",
      "Higher usage limits",
      "Priority support",
    ],
    limits: PLAN_LIMITS.business,
    featureFlags: PLAN_FEATURES.business,
    badge: "Best Value",
    accountType: "employer",
    displayOrder: 3,
    isActive: true,
  },
];

export const USAGE_METRIC_LABELS: Record<UsageMetricKey, string> = {
  activeJobs: "Active Jobs",
  applications: "Applications",
  talentSearch: "Talent Search",
  teamMembers: "Team Members",
};

export function getPlanDefinition(planId: PlanId): PlanDefinition {
  const plan = PLAN_DEFINITIONS.find((item) => item.id === planId);
  if (!plan) {
    return PLAN_DEFINITIONS[0];
  }
  return plan;
}

export function getPlanLimits(planId: PlanId): PlanLimits {
  return PLAN_LIMITS[planId];
}

export function canUseFeature(
  planId: PlanId,
  feature: PlanFeature,
): boolean {
  return PLAN_FEATURES[planId].includes(feature);
}

export function hasPlanEntitlement(
  planId: PlanId,
  entitlement: PlanEntitlement,
): boolean {
  return canUseFeature(planId, ENTITLEMENT_TO_FEATURE[entitlement]);
}

export function getPlanLimit(
  planId: PlanId,
  key: UsageMetricKey,
): number | null {
  return PLAN_LIMITS[planId][key];
}

export function getUsagePercentage(
  used: number,
  limit: number | null,
): number | null {
  if (limit === null) return null;
  if (limit <= 0) return used > 0 ? 100 : 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function isNearLimit(
  used: number,
  limit: number | null,
  threshold = 0.8,
): boolean {
  if (limit === null) return false;
  return used / limit >= threshold && used < limit;
}

export function isAtLimit(used: number, limit: number | null): boolean {
  if (limit === null) return false;
  return used >= limit;
}

export function canCreateJob(subscription: EmployerSubscription): boolean {
  const limit = PLAN_LIMITS[subscription.planId].activeJobs;
  return !isAtLimit(subscription.usage.activeJobs, limit);
}

export function buildUsageMetrics(
  subscription: EmployerSubscription,
): UsageMetric[] {
  const limits = PLAN_LIMITS[subscription.planId];
  const keys: UsageMetricKey[] = [
    "activeJobs",
    "applications",
    "talentSearch",
    "teamMembers",
  ];

  return keys.map((key) => ({
    key,
    label: USAGE_METRIC_LABELS[key],
    used: subscription.usage[key],
    limit: limits[key],
  }));
}

export function daysUntil(dateIso: string | null, now = new Date()): number | null {
  if (!dateIso) return null;
  const target = new Date(dateIso);
  if (Number.isNaN(target.getTime())) return null;
  const diffMs = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function formatPlanPrice(
  priceMonthly: number,
  currency: PlanDefinition["currency"] = "INR",
): string {
  if (currency === "INR") {
    if (priceMonthly === 0) return "₹0";
    return `₹${priceMonthly.toLocaleString("en-IN")}`;
  }
  if (priceMonthly === 0) return "$0";
  return `$${priceMonthly}`;
}
