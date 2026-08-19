/**
 * Admin Subscription Plan Types (Sprint 10D)
 * Separate and explicit definitions for Candidate and Employer plans.
 */

export type AdminPlanType = "candidate" | "employer";

export type DurationUnit = "days" | "months" | "years";

export type PlanCurrency = "INR" | "USD";

export type PlanSortField = "sort_order" | "name" | "price_monthly" | "created_at" | "updated_at";
export type PlanSortOrder = "asc" | "desc";

// ----------------------------------------------------------------------------
// Candidate Plan Types
// ----------------------------------------------------------------------------

export type CandidateFeatureOption = {
  key: string;
  label: string;
  category: "search" | "resume" | "visibility" | "applications" | "support";
  description: string;
};

export type CandidatePlanLimits = {
  applicationsPerMonth: number | null; // null = Unlimited
  jobAlerts: number | null;
  savedJobs: number | null;
  resumeVersions: number | null;
};

export type AdminCandidatePlan = {
  id: string; // unique slug / identifier
  name: string;
  tagline: string;
  description: string;
  priceMonthly: number;
  priceQuarterly: number;
  priceYearly: number;
  currency: PlanCurrency;
  durationValue: number;
  durationUnit: DurationUnit;
  billingCycle: "monthly" | "quarterly" | "yearly";
  isActive: boolean;
  badge?: string | null;
  highlighted: boolean;
  features: string[]; // bullets displayed to candidate
  featureFlags: string[]; // system capability keys
  limits: CandidatePlanLimits;
  sortOrder: number;
  activeSubscriptionsCount?: number;
  totalSubscriptionsCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type CandidatePlanFormData = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  priceMonthly: number;
  priceQuarterly: number;
  priceYearly: number;
  currency: PlanCurrency;
  durationValue: number;
  durationUnit: DurationUnit;
  billingCycle: "monthly" | "quarterly" | "yearly";
  isActive: boolean;
  badge: string;
  highlighted: boolean;
  features: string[];
  featureFlags: string[];
  limits: CandidatePlanLimits;
  sortOrder: number;
};

// ----------------------------------------------------------------------------
// Employer Plan Types
// ----------------------------------------------------------------------------

export type EmployerFeatureOption = {
  key: string;
  label: string;
  category: "jobs" | "search" | "interviews" | "team" | "analytics" | "support";
  description: string;
};

export type EmployerPlanLimits = {
  activeJobs: number | null; // null = Unlimited
  applications: number | null;
  talentSearch: number | null;
  teamMembers: number | null;
};

export type AdminEmployerPlan = {
  id: string; // unique slug / identifier
  name: string;
  tagline: string;
  description: string;
  priceMonthly: number;
  priceQuarterly: number;
  priceYearly: number;
  currency: PlanCurrency;
  durationValue: number;
  durationUnit: DurationUnit;
  isActive: boolean;
  badge?: string | null;
  highlighted: boolean;
  features: string[]; // bullets displayed to employer
  featureFlags: string[]; // system capability keys
  limits: EmployerPlanLimits;
  sortOrder: number;
  activeSubscriptionsCount?: number;
  totalSubscriptionsCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type EmployerPlanFormData = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  priceMonthly: number;
  priceQuarterly: number;
  priceYearly: number;
  currency: PlanCurrency;
  durationValue: number;
  durationUnit: DurationUnit;
  isActive: boolean;
  badge: string;
  highlighted: boolean;
  features: string[];
  featureFlags: string[];
  limits: EmployerPlanLimits;
  sortOrder: number;
};

// ----------------------------------------------------------------------------
// Filter & View States
// ----------------------------------------------------------------------------

export type PlanFilterState = {
  search: string;
  status: "all" | "active" | "inactive";
};
