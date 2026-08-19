import type {
  CandidatePlanDefinition,
  CandidatePlanFeatureKey,
  CandidatePlanId,
  CandidatePlanLimits,
  CandidateSubscription,
  CandidateUsageMetric,
  CandidateUsageMetricKey,
} from "../types/subscription.types";

export const CANDIDATE_PLAN_LIMITS: Record<CandidatePlanId, CandidatePlanLimits> = {
  free: {
    applicationsPerMonth: 5,
    jobAlerts: 5,
    savedJobs: 15,
    resumeVersions: 1,
  },
  professional: {
    applicationsPerMonth: 25,
    jobAlerts: 20,
    savedJobs: 50,
    resumeVersions: 3,
  },
  premium: {
    applicationsPerMonth: null,
    jobAlerts: null,
    savedJobs: null,
    resumeVersions: null,
  },
};

export const CANDIDATE_PLAN_FEATURES: Record<CandidatePlanId, CandidatePlanFeatureKey[]> = {
  free: [
    "job_search",
    "basic_filters",
    "applications",
    "saved_jobs",
    "job_alerts",
    "resume_builder",
    "application_tracking",
    "candidate_profile",
    "recruiter_messaging",
  ],
  professional: [
    "job_search",
    "basic_filters",
    "advanced_search",
    "applications",
    "saved_jobs",
    "job_alerts",
    "resume_builder",
    "ats_resume_score",
    "application_tracking",
    "candidate_profile",
    "recruiter_messaging",
    "priority_support",
  ],
  premium: [
    "job_search",
    "basic_filters",
    "advanced_search",
    "applications",
    "saved_jobs",
    "job_alerts",
    "resume_builder",
    "ats_resume_score",
    "multi_resume",
    "application_tracking",
    "application_insights",
    "candidate_profile",
    "profile_visibility",
    "recruiter_messaging",
    "direct_recruiter_reach",
    "candidate_analytics",
    "priority_support",
  ],
};

export const CANDIDATE_PLAN_DEFINITIONS: CandidatePlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    tagline: "For candidates exploring SAP opportunities.",
    priceMonthly: 0,
    priceQuarterly: 0,
    priceYearly: 0,
    currency: "INR",
    billingPeriod: "month",
    description: "Get started with essential job search and application tools.",
    features: [
      "5 applications / month",
      "15 saved jobs",
      "5 active job alerts",
      "SAP job search & basic filters",
      "Candidate profile",
      "Basic resume builder",
      "Standard application tracking",
    ],
    limits: CANDIDATE_PLAN_LIMITS.free,
    featureFlags: CANDIDATE_PLAN_FEATURES.free,
    accountType: "candidate",
    displayOrder: 1,
  },
  {
    id: "professional",
    name: "Professional",
    tagline: "For candidates actively applying and looking for better job-search tools.",
    priceMonthly: 499,
    priceQuarterly: 1349,
    priceYearly: 4799,
    currency: "INR",
    billingPeriod: "month",
    description: "Accelerate your SAP search with higher limits and ATS tools.",
    badge: "Most Popular",
    highlighted: true,
    features: [
      "Everything in Free",
      "25 applications / month",
      "50 saved jobs",
      "20 active job alerts",
      "Advanced SAP search & filters",
      "ATS Resume Score & feedback",
      "Enhanced application tracking",
      "Enhanced candidate profile",
      "Priority email support",
    ],
    limits: CANDIDATE_PLAN_LIMITS.professional,
    featureFlags: CANDIDATE_PLAN_FEATURES.professional,
    accountType: "candidate",
    displayOrder: 2,
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "For serious candidates who want advanced tools to maximize their chances of getting hired.",
    priceMonthly: 999,
    priceQuarterly: 2699,
    priceYearly: 9599,
    currency: "INR",
    billingPeriod: "month",
    description: "Maximum visibility, unlimited capacity, and direct recruiter reach.",
    features: [
      "Everything in Professional",
      "Unlimited job applications",
      "Unlimited saved jobs",
      "Unlimited job alerts",
      "Multi-resume management",
      "Advanced application insights",
      "Priority profile visibility to employers",
      "Direct recruiter outreach",
      "Dedicated concierge support",
    ],
    limits: CANDIDATE_PLAN_LIMITS.premium,
    featureFlags: CANDIDATE_PLAN_FEATURES.premium,
    accountType: "candidate",
    displayOrder: 3,
  },
];

export const CANDIDATE_USAGE_METRIC_LABELS: Record<CandidateUsageMetricKey, string> = {
  applications: "Applications this month",
  jobAlerts: "Active Job Alerts",
  savedJobs: "Saved Jobs",
  resumeVersions: "Resume Versions",
};

export function getCandidatePlanDefinition(planId: CandidatePlanId): CandidatePlanDefinition {
  const plan = CANDIDATE_PLAN_DEFINITIONS.find((item) => item.id === planId);
  if (!plan) {
    return CANDIDATE_PLAN_DEFINITIONS[0];
  }
  return plan;
}

export function getCandidatePlanLimits(planId: CandidatePlanId): CandidatePlanLimits {
  return CANDIDATE_PLAN_LIMITS[planId];
}

export function canUseCandidateFeature(
  planId: CandidatePlanId,
  feature: CandidatePlanFeatureKey,
): boolean {
  return CANDIDATE_PLAN_FEATURES[planId].includes(feature);
}

export function getCandidatePlanLimit(
  planId: CandidatePlanId,
  key: CandidateUsageMetricKey,
): number | null {
  const limits = CANDIDATE_PLAN_LIMITS[planId];
  if (key === "applications") return limits.applicationsPerMonth;
  if (key === "jobAlerts") return limits.jobAlerts;
  if (key === "savedJobs") return limits.savedJobs;
  if (key === "resumeVersions") return limits.resumeVersions;
  return null;
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

export function buildCandidateUsageMetrics(
  subscription: CandidateSubscription,
): CandidateUsageMetric[] {
  const limits = CANDIDATE_PLAN_LIMITS[subscription.planId];
  const keys: Array<{ key: CandidateUsageMetricKey; limit: number | null }> = [
    { key: "applications", limit: limits.applicationsPerMonth },
    { key: "jobAlerts", limit: limits.jobAlerts },
    { key: "savedJobs", limit: limits.savedJobs },
    { key: "resumeVersions", limit: limits.resumeVersions },
  ];

  return keys.map(({ key, limit }) => ({
    key,
    label: CANDIDATE_USAGE_METRIC_LABELS[key],
    used: subscription.usage[key] ?? 0,
    limit,
  }));
}

export function formatCandidatePlanPrice(
  priceMonthly: number,
  currency: CandidatePlanDefinition["currency"] = "INR",
): string {
  if (currency === "INR") {
    if (priceMonthly === 0) return "₹0";
    return `₹${priceMonthly.toLocaleString("en-IN")}`;
  }
  return `₹${priceMonthly}`;
}

export type ComparisonRow = {
  category?: string;
  label: string;
  tooltip?: string;
  values: Record<CandidatePlanId, string | boolean>;
};

function limitLabel(limit: number | null, suffix = ""): string {
  return limit === null ? "Unlimited" : `${limit}${suffix}`;
}

export const CANDIDATE_COMPARISON_ROWS: ComparisonRow[] = [
  {
    category: "Job Search & Applications",
    label: "SAP Job Search",
    values: {
      free: true,
      professional: true,
      premium: true,
    },
  },
  {
    category: "Job Search & Applications",
    label: "Search & Filtering",
    values: {
      free: "Basic filters",
      professional: "Advanced filters",
      premium: "Advanced + Keyword AI",
    },
  },
  {
    category: "Job Search & Applications",
    label: "Monthly Applications",
    values: {
      free: limitLabel(CANDIDATE_PLAN_LIMITS.free.applicationsPerMonth, " / mo"),
      professional: limitLabel(CANDIDATE_PLAN_LIMITS.professional.applicationsPerMonth, " / mo"),
      premium: limitLabel(CANDIDATE_PLAN_LIMITS.premium.applicationsPerMonth),
    },
  },
  {
    category: "Job Search & Applications",
    label: "Saved Jobs",
    values: {
      free: limitLabel(CANDIDATE_PLAN_LIMITS.free.savedJobs),
      professional: limitLabel(CANDIDATE_PLAN_LIMITS.professional.savedJobs),
      premium: limitLabel(CANDIDATE_PLAN_LIMITS.premium.savedJobs),
    },
  },
  {
    category: "Job Search & Applications",
    label: "Active Job Alerts",
    values: {
      free: limitLabel(CANDIDATE_PLAN_LIMITS.free.jobAlerts),
      professional: limitLabel(CANDIDATE_PLAN_LIMITS.professional.jobAlerts),
      premium: limitLabel(CANDIDATE_PLAN_LIMITS.premium.jobAlerts),
    },
  },
  {
    category: "Profile & Resume",
    label: "Candidate Profile",
    values: {
      free: "Standard",
      professional: "Enhanced with Badges",
      premium: "Featured Profile",
    },
  },
  {
    category: "Profile & Resume",
    label: "Resume Versions",
    values: {
      free: limitLabel(CANDIDATE_PLAN_LIMITS.free.resumeVersions),
      professional: limitLabel(CANDIDATE_PLAN_LIMITS.professional.resumeVersions),
      premium: limitLabel(CANDIDATE_PLAN_LIMITS.premium.resumeVersions),
    },
  },
  {
    category: "Profile & Resume",
    label: "ATS Resume Scoring",
    values: {
      free: false,
      professional: true,
      premium: true,
    },
  },
  {
    category: "Visibility & Insights",
    label: "Application Tracking",
    values: {
      free: "Basic status",
      professional: "Enhanced timeline",
      premium: "Advanced insights",
    },
  },
  {
    category: "Visibility & Insights",
    label: "Talent Search Visibility",
    values: {
      free: "Standard",
      professional: "Priority ranking",
      premium: "Top candidate spotlight",
    },
  },
  {
    category: "Visibility & Insights",
    label: "Direct Recruiter Outreach",
    values: {
      free: false,
      professional: "Fast-track replies",
      premium: "Direct recruiter reach",
    },
  },
  {
    category: "Support",
    label: "Customer Support",
    values: {
      free: "Standard",
      professional: "Priority Email",
      premium: "Dedicated Concierge",
    },
  },
];
