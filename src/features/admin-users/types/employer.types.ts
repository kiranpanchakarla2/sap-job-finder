/**
 * Employer Management Types for Super Admin Portal (Sprint 10C)
 */

export type EmployerAccountStatus = "active" | "suspended" | "inactive";
export type EmployerSubscriptionStatus = "active" | "expired" | "none" | "trialing" | "past_due" | "cancelled";
export type EmployerCompanyUserRole = "owner" | "admin" | "recruiter" | "hiring_manager";

export type AdminEmployerListItem = {
  id: string;
  userId: string;
  companyName: string;
  logoUrl: string | null;
  adminEmail: string;
  adminName: string;
  location: string | null;
  industry: string | null;
  companySize: string | null;
  subscriptionPlan: string;
  subscriptionStatus: EmployerSubscriptionStatus;
  accountStatus: EmployerAccountStatus;
  isVerified: boolean;
  activeJobsCount: number;
  totalJobsCount: number;
  setupComplete: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CompanyUserItem = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: EmployerCompanyUserRole;
  status: "active" | "invited" | "suspended";
  joinedAt: string;
};

export type EmployerJobPreviewItem = {
  id: string;
  title: string;
  sapModule: string;
  location: string;
  employmentType: string;
  status: string;
  createdAt: string;
};

export type EmployerJobSummary = {
  totalJobs: number;
  activeJobs: number;
  draftJobs: number;
  closedJobs: number;
  expiredJobs: number;
  recentJobs: EmployerJobPreviewItem[];
};

export type EmployerSubscriptionDetails = {
  planId: string;
  planName: string;
  tagline?: string;
  status: string;
  billingCycle: string;
  priceMonthly: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  renewalDate?: string | null;
  nextBillingDate?: string | null;
  daysRemaining: number;
};

export type AdminEmployerDetails = {
  id: string;
  userId: string;
  companyName: string;
  logoUrl: string | null;
  website: string | null;
  industry: string | null;
  companySize: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  location: string | null;
  about: string | null;
  recruiterName: string;
  designation: string;
  workEmail: string;
  phone: string;
  setupComplete: boolean;
  isVerified: boolean;
  accountStatus: EmployerAccountStatus;
  companyUsers: CompanyUserItem[];
  jobSummary: EmployerJobSummary;
  subscription: EmployerSubscriptionDetails | null;
  createdAt: string;
  updatedAt: string;
};

export type EmployerFilterState = {
  search: string;
  status: "all" | "active" | "suspended" | "inactive";
  subscription: "all" | "active" | "expired" | "none";
  verification: "all" | "verified" | "unverified";
  registrationDate: "all" | "today" | "7d" | "30d" | "custom";
  customStart?: string;
  customEnd?: string;
};

export type EmployerSortField = "created_at" | "company_name" | "active_jobs";
export type EmployerSortOrder = "asc" | "desc";

export type EmployerPaginationState = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
