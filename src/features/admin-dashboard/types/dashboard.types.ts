/**
 * Super Admin Dashboard TypeScript Types
 * Sprint 10B: Centralized types for all metrics, filters, and previews.
 */

export type DateRangeOption =
  | "today"
  | "7d"
  | "30d"
  | "this_month"
  | "last_month"
  | "custom";

export type DateRangeFilter = {
  option: DateRangeOption;
  startDate: string; // ISO string
  endDate: string; // ISO string
  label: string;
};

export type UsersKpis = {
  totalCandidates: number;
  totalEmployers: number;
  newCandidates: number;
  newEmployers: number;
};

export type SubscriptionKpis = {
  activeCandidateSubs: number;
  expiringCandidateSubs: number;
  activeEmployerSubs: number;
  expiringEmployerSubs: number;
  recentlyActivatedCount: number;
};

export type PaymentKpis = {
  pendingRequestsCount: number;
  paymentsReceivedCount: number;
  totalAmountCollected: number;
  requestsInPeriod: number;
  collectedInPeriod: number;
  currency: string;
};

export type PendingPaymentItem = {
  id: string;
  requesterName: string;
  email: string;
  accountType: "candidate" | "employer";
  planName: string;
  amount: number;
  currency: string;
  requestedAt: string;
  status: "pending" | "payment_link_sent" | "payment_received" | "cancelled";
};

export type RecentCandidateItem = {
  id: string;
  userId: string;
  name: string;
  email: string;
  registrationDate: string;
  status: string;
  headline?: string | null;
  location?: string | null;
};

export type RecentEmployerItem = {
  id: string;
  userId: string;
  companyName: string;
  email: string;
  registrationDate: string;
  status: string;
  industry?: string | null;
  city?: string | null;
};

export type RecentJobItem = {
  id: string;
  title: string;
  companyName: string;
  sapModule: string;
  location: string;
  postedDate: string;
  status: string;
  employmentType?: string | null;
};

export type ContactUsSummary = {
  newCount: number;
  inProgressCount: number;
  resolvedCount: number;
  totalCount: number;
};

export type SapModuleUsage = {
  module: string;
  jobCount: number;
};

export type SapModuleSummary = {
  totalActiveModules: number;
  topModules: SapModuleUsage[];
};

export type ActivityItemType =
  | "candidate_registered"
  | "employer_registered"
  | "payment_requested"
  | "payment_received"
  | "subscription_activated"
  | "job_posted"
  | "contact_enquiry";

export type ActivityItem = {
  id: string;
  type: ActivityItemType;
  title: string;
  description: string;
  timestamp: string;
  userOrCompany?: string | null;
};

export type DashboardData = {
  users: UsersKpis;
  subscriptions: SubscriptionKpis;
  payments: PaymentKpis;
  pendingPayments: PendingPaymentItem[];
  recentCandidates: RecentCandidateItem[];
  recentEmployers: RecentEmployerItem[];
  recentJobs: RecentJobItem[];
  contactUs: ContactUsSummary;
  sapModules: SapModuleSummary;
  recentActivity: ActivityItem[];
};

export type DashboardErrors = {
  users?: string;
  subscriptions?: string;
  payments?: string;
  pendingPayments?: string;
  recentCandidates?: string;
  recentEmployers?: string;
  recentJobs?: string;
  contactUs?: string;
  sapModules?: string;
  recentActivity?: string;
};
