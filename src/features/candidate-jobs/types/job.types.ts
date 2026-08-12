/**
 * Candidate Job Discovery models (Sprint 3 Phase A — local/mock).
 * Aligned conceptually with EmployerJobRecord for Phase B Supabase mapping.
 */

export type WorkMode = "Remote" | "Hybrid" | "On-site";

export type EmploymentType =
  | "Full-time"
  | "Part-time"
  | "Contract"
  | "Internship"
  | "Freelance";

export type JobStatus = "active" | "paused" | "closed";

export type ExperienceFilterOption =
  | "Entry Level"
  | "1–3 Years"
  | "3–5 Years"
  | "5–8 Years"
  | "8–12 Years"
  | "12+ Years";

export type SalaryFilterOption =
  | "Under ₹5 LPA"
  | "₹5–10 LPA"
  | "₹10–15 LPA"
  | "₹15–25 LPA"
  | "₹25–40 LPA"
  | "₹40+ LPA";

export type PostedDateFilter =
  | "any"
  | "24h"
  | "3d"
  | "7d"
  | "14d"
  | "30d";

export type JobSortOption =
  | "relevance"
  | "recent"
  | "salary_high"
  | "salary_low";

export type MatchTier = "strong" | "good" | "potential";

export type DiscoveryCompany = {
  id: string;
  name: string;
  logo: string;
  logoColor: string;
  description: string;
  industry: string;
  companySize: string;
  location: string;
  website?: string;
};

/**
 * Candidate-facing job shape. Maps from EmployerJobRecord via mapEmployerJobToDiscovery.
 * Phase A uses mock representations of the same conceptual `jobs` source.
 */
export type DiscoveryJob = {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  companyLogoColor: string;
  /** Optional Storage / CDN logo URL from company_profiles.logo_url */
  companyLogoUrl?: string | null;
  location: string;
  locations: string[];
  workMode: WorkMode;
  employmentType: EmploymentType;
  experienceMin: number;
  experienceMax: number | null;
  experienceLabel: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: "INR";
  salaryLabel: string;
  description: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  sapModules: string[];
  benefits: string[];
  /** ISO date string for filtering / sorting */
  postedAt: string;
  department: string;
  status: JobStatus;
  expiresAt: string | null;
  industry: string;
  companySize: string;
  companyDescription: string;
  companyLocation: string;
  featured?: boolean;
};

export type JobSearchState = {
  keyword: string;
  location: string;
  experience: ExperienceFilterOption[];
  sapModules: string[];
  locations: string[];
  workModes: WorkMode[];
  jobTypes: EmploymentType[];
  salaryRanges: SalaryFilterOption[];
  salaryMinCustom: number | null;
  salaryMaxCustom: number | null;
  postedDate: PostedDateFilter;
  sort: JobSortOption;
};

export type CandidateMatchProfile = {
  skills: string[];
  sapModules: string[];
  experienceYears: number;
  preferredLocations: string[];
  workModes: WorkMode[];
  preferredJobRoles: string[];
};

export type JobMatchResult = {
  score: number;
  tier: MatchTier | null;
};

export const DEFAULT_JOB_SEARCH_STATE: JobSearchState = {
  keyword: "",
  location: "",
  experience: [],
  sapModules: [],
  locations: [],
  workModes: [],
  jobTypes: [],
  salaryRanges: [],
  salaryMinCustom: null,
  salaryMaxCustom: null,
  postedDate: "any",
  sort: "relevance",
};
