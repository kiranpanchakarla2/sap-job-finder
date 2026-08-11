export type PlanId = "free" | "pro" | "business";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "cancelled";

export type PlanFeature =
  | "basic_analytics"
  | "advanced_analytics"
  | "talent_search"
  | "candidate_messaging"
  | "interview_management"
  | "team_members"
  | "priority_support";

export type PlanLimits = {
  /** null = unlimited */
  activeJobs: number | null;
  applications: number | null;
  talentSearch: number | null;
  teamMembers: number | null;
};

export type PlanDefinition = {
  id: PlanId;
  name: string;
  priceMonthly: number;
  billingPeriod: "month";
  description: string;
  features: string[];
  limits: PlanLimits;
  featureFlags: PlanFeature[];
  highlighted?: boolean;
};

export type UsageMetricKey =
  | "activeJobs"
  | "applications"
  | "talentSearch"
  | "teamMembers";

export type UsageMetric = {
  key: UsageMetricKey;
  label: string;
  used: number;
  /** null = unlimited */
  limit: number | null;
};

export type InvoiceStatus = "paid" | "open" | "void";

export type Invoice = {
  id: string;
  date: string;
  label: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
};

export type EmployerSubscription = {
  planId: PlanId;
  status: SubscriptionStatus;
  renewalDate: string | null;
  trialEndsAt: string | null;
  billingCycle: "monthly" | "yearly";
  nextBillingDate: string | null;
  paymentMethodConfigured: boolean;
  usage: Record<UsageMetricKey, number>;
  invoices: Invoice[];
};

export type SubscriptionServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
