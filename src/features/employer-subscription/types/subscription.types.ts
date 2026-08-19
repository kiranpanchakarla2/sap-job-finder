import type {
  BillingCycle,
  PaymentRequestRecord,
  PaymentRequestStatus,
} from "@/features/shared-subscription";

export type { BillingCycle, PaymentRequestRecord, PaymentRequestStatus };

export type PlanId = "free" | "pro" | "business";

export type PlanCurrency = "INR" | "USD";

export type SubscriptionStatus =
  | "pending"
  | "active"
  | "trialing"
  | "past_due"
  | "cancelled"
  | "expired";

export type PlanFeature =
  | "basic_analytics"
  | "advanced_analytics"
  | "talent_search"
  | "candidate_messaging"
  | "interview_management"
  | "team_members"
  | "priority_support"
  | "bulk_upload";

/** UI/service entitlement keys mapped to plan features. */
export type PlanEntitlement =
  | "talentSearch"
  | "advancedAnalytics"
  | "teamManagement"
  | "bulkUpload";

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
  priceQuarterly: number;
  priceYearly: number;
  currency: PlanCurrency;
  billingPeriod: "month";
  description: string;
  features: string[];
  limits: PlanLimits;
  featureFlags: PlanFeature[];
  highlighted?: boolean;
  badge?: string;
  accountType?: "employer";
  displayOrder?: number;
  isActive?: boolean;
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
  billingCycle: BillingCycle;
  price?: number;
  nextBillingDate: string | null;
  paymentMethodConfigured: boolean;
  usage: Record<UsageMetricKey, number>;
  invoices: Invoice[];
};

export type SubscriptionServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
