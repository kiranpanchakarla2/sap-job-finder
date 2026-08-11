import type {
  EmployerSubscription,
  PlanDefinition,
  PlanFeature,
  PlanId,
  PlanLimits,
  UsageMetric,
  UsageMetricKey,
} from "../types/subscription.types";

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    activeJobs: 3,
    applications: 50,
    talentSearch: 10,
    teamMembers: 1,
  },
  pro: {
    activeJobs: 15,
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
  ],
  business: [
    "basic_analytics",
    "advanced_analytics",
    "talent_search",
    "candidate_messaging",
    "interview_management",
    "team_members",
    "priority_support",
  ],
};

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    billingPeriod: "month",
    description: "Get started with essential hiring tools.",
    features: [
      "3 active jobs",
      "Basic applicant management",
      "Basic analytics",
      "Interview scheduling",
      "Candidate messaging",
    ],
    limits: PLAN_LIMITS.free,
    featureFlags: PLAN_FEATURES.free,
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 29,
    billingPeriod: "month",
    description: "Scale hiring with advanced insights and Talent Search.",
    features: [
      "15 active jobs",
      "Advanced analytics",
      "Talent Search",
      "Candidate messaging",
      "Interview management",
      "Priority features",
    ],
    limits: PLAN_LIMITS.pro,
    featureFlags: PLAN_FEATURES.pro,
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    priceMonthly: 99,
    billingPeriod: "month",
    description: "Unlimited hiring capacity for growing teams.",
    features: [
      "Unlimited active jobs",
      "Advanced analytics",
      "Talent Search",
      "Team capabilities",
      "Higher usage limits",
      "Priority support",
    ],
    limits: PLAN_LIMITS.business,
    featureFlags: PLAN_FEATURES.business,
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

export function formatPlanPrice(priceMonthly: number): string {
  if (priceMonthly === 0) return "$0";
  return `$${priceMonthly}`;
}
