/**
 * Candidate Management Types for Super Admin Portal (Sprint 10C)
 */

export type CandidateAccountStatus = "active" | "suspended" | "inactive";
export type CandidateSubscriptionStatus = "active" | "expired" | "none" | "trialing" | "past_due" | "cancelled";
export type CandidateDiscoverability = "open_to_opportunities" | "available" | "not_available";

export type AdminCandidateListItem = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  headline: string | null;
  sapModules: string[];
  totalExperience: number;
  experienceBand: string | null;
  location: string | null;
  discoveryStatus: CandidateDiscoverability;
  isSearchable: boolean;
  subscriptionPlan: string;
  subscriptionStatus: CandidateSubscriptionStatus;
  accountStatus: CandidateAccountStatus;
  profileCompletion: number;
  createdAt: string;
  updatedAt: string;
};

export type CandidateCertificationItem = {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expirationDate?: string | null;
  credentialId?: string | null;
  status: string;
};

export type CandidateExperienceItem = {
  id: string;
  companyName: string;
  designation: string;
  employmentType?: string | null;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  description?: string | null;
};

export type CandidateEducationItem = {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string | null;
  startDate: string;
  endDate?: string | null;
  grade?: string | null;
};

export type CandidateSkillItem = {
  name: string;
  experienceYears?: number | null;
  proficiency?: string | null;
};

export type CandidateSubscriptionDetails = {
  planId: string;
  planName: string;
  tagline?: string;
  status: string;
  billingCycle: string;
  priceMonthly: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  daysRemaining: number;
  cancelAtPeriodEnd: boolean;
};

export type CandidatePrivacySettings = {
  profileVisibility: "public" | "private";
  showInTalentSearch: boolean;
  showResumeToRecruiters: boolean;
};

export type AdminCandidateDetails = {
  id: string;
  userId: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  headline: string | null;
  aboutMe: string | null;
  location: string | null;
  currentCity: string | null;
  currentState: string | null;
  country: string | null;
  currentCompany: string | null;
  currentJobRole: string | null;
  employmentStatus: string | null;
  totalExperience: number;
  experienceBand: string | null;
  sapExperienceBand: string | null;
  currentCtc: number | null;
  expectedCtc: number | null;
  preferredSalaryRange: string | null;
  noticePeriod: string | null;
  preferredLocations: string[];
  preferredJobRoles: string[];
  preferredSapModules: string[];
  sapSkills: string[];
  skillsList: CandidateSkillItem[];
  moduleExperience: Array<{ module: string; years: number | string }>;
  certifications: CandidateCertificationItem[];
  workExperience: CandidateExperienceItem[];
  education: CandidateEducationItem[];
  resumeUrl: string | null;
  resumeFileName: string | null;
  portfolioUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  profileCompletion: number;
  discoveryStatus: CandidateDiscoverability;
  isSearchable: boolean;
  privacyPreferences: CandidatePrivacySettings;
  accountStatus: CandidateAccountStatus;
  subscription: CandidateSubscriptionDetails | null;
  createdAt: string;
  updatedAt: string;
};

export type CandidateFilterState = {
  search: string;
  status: "all" | "active" | "suspended" | "inactive";
  subscription: "all" | "active" | "expired" | "none";
  discoverability: "all" | "discoverable" | "not_discoverable";
  sapModule: string;
  registrationDate: "all" | "today" | "7d" | "30d" | "custom";
  customStart?: string;
  customEnd?: string;
};

export type CandidateSortField = "created_at" | "full_name" | "total_experience";
export type CandidateSortOrder = "asc" | "desc";

export type CandidatePaginationState = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
