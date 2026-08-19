/**
 * Universal Subscription and Billing Types for Candidate and Employer Portals.
 * Sprint 9A — Subscription Foundation
 */

export type AccountType = "candidate" | "employer";

export type BillingCycle = "monthly" | "quarterly" | "yearly";

export type SubscriptionStatus =
  | "pending"
  | "active"
  | "trialing"
  | "past_due"
  | "cancelled"
  | "expired";

export type PaymentRequestStatus =
  | "pending"
  | "payment_link_sent"
  | "payment_received"
  | "cancelled";

export type PlanCurrency = "INR" | "USD";

export interface BillingCycleMetadata {
  code: BillingCycle;
  displayName: string;
  durationMonths: number;
  description: string;
  tagline?: string;
}

export interface PlanPricing {
  monthly: number;
  quarterly: number;
  yearly: number;
  currency: PlanCurrency;
}

export interface SavingsCalculation {
  billingCycle: BillingCycle;
  monthlyPrice: number;
  cyclePrice: number;
  durationMonths: number;
  totalWithoutDiscount: number;
  savings: number;
  monthlyEquivalent: number;
  discountPercentage: number;
}

export interface BasePlanDefinition {
  id: string;
  name: string;
  description: string;
  accountType: AccountType;
  priceMonthly: number;
  priceQuarterly: number;
  priceYearly: number;
  currency: PlanCurrency;
  features: string[];
  displayOrder: number;
  isActive: boolean;
  tagline?: string;
  badge?: string;
  highlighted?: boolean;
}

export interface CandidatePlanLimits {
  applicationsPerMonth: number | null;
  jobAlerts: number | null;
  savedJobs: number | null;
  resumeVersions: number | null;
}

export interface EmployerPlanLimits {
  activeJobs: number | null;
  applications: number | null;
  talentSearch: number | null;
  teamMembers: number | null;
}

export interface BaseSubscriptionRecord {
  id: string;
  accountType: AccountType;
  planId: string;
  billingCycle: BillingCycle;
  price: number;
  currency: PlanCurrency;
  status: SubscriptionStatus;
  startDate: string;
  currentPeriodEnd: string;
  renewalDate: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentRequestRecord {
  id: string;
  accountType: AccountType;
  userId?: string | null;
  candidateId?: string | null;
  companyId?: string | null;
  planId: string;
  planName?: string | null;
  billingCycle: BillingCycle;
  amount: number;
  currency: PlanCurrency;
  customerName: string;
  email: string;
  whatsappNumber: string;
  companyName?: string | null;
  status: PaymentRequestStatus;
  notes?: string | null;
  paymentLink?: string | null;
  requestedAt: string;
  expiresAt?: string | null;
  paymentLinkSentAt?: string | null;
  paymentReceivedAt?: string | null;
  cancelledAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  isExisting?: boolean;
}

export interface CreateCandidatePaymentRequestInput {
  planId: string;
  billingCycle: BillingCycle;
  whatsappNumber: string;
  customerName?: string;
  email?: string;
  notes?: string;
}

export interface CreateEmployerPaymentRequestInput {
  planId: string;
  billingCycle: BillingCycle;
  whatsappNumber: string;
  contactName?: string;
  email?: string;
  companyName?: string;
  notes?: string;
}

export interface CreatePaymentRequestInput {
  accountType: AccountType;
  planId: string;
  billingCycle: BillingCycle;
  whatsappNumber: string;
  customerName?: string;
  email?: string;
  companyName?: string;
  notes?: string;
}

export type PaymentRequestDisplayVariant =
  | "pending"
  | "payment_link_sent"
  | "payment_received"
  | "cancelled"
  | "expired";

export interface PaymentRequestDisplayInfo {
  status: PaymentRequestStatus | "expired";
  variant: PaymentRequestDisplayVariant;
  label: string;
  description: string;
  isExpired: boolean;
  isActionable: boolean;
}

export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type RenewalMilestone =
  | "30_day"
  | "14_day"
  | "7_day"
  | "1_day"
  | "expired";

export type SubscriptionNotificationType =
  | "subscription_renewal"
  | "subscription_expired";

export interface SubscriptionNotificationRecord {
  id: string;
  subscriptionId: string;
  accountType: AccountType;
  userId?: string | null;
  candidateId?: string | null;
  companyId?: string | null;
  notificationType: SubscriptionNotificationType;
  milestone: RenewalMilestone;
  triggeredAt: string;
  createdAt?: string;
}

export interface RenewalNotificationContent {
  milestone: RenewalMilestone;
  title: string;
  description: string;
  ctaText: string;
  daysRemaining: number | null;
  variant: "info" | "warning" | "error" | "pending";
  isExpired: boolean;
}

export interface RecordNotificationInput {
  subscriptionId: string;
  accountType: AccountType;
  milestone: RenewalMilestone;
  notificationType?: SubscriptionNotificationType;
}

