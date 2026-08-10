import type { EmployerJobStatus } from "@/types/employer";

export type JobStatus = EmployerJobStatus;

export type EmploymentType = "Full-time" | "Part-time";

export type JobType =
  | "Permanent"
  | "Contract"
  | "Contract-to-Hire"
  | "Freelance";

export type ExperienceLevel =
  | "Entry Level"
  | "Mid Level"
  | "Senior"
  | "Lead"
  | "Architect";

export type WorkArrangement = "On-site" | "Hybrid" | "Remote";

export type ProjectType =
  | "Implementation"
  | "Support"
  | "Rollout"
  | "Migration"
  | "Upgrade"
  | "Managed Services";

export type SalaryType = "Range" | "Fixed" | "Negotiable" | "Not specified";

export type Currency = "USD" | "EUR" | "GBP" | "INR" | "AUD" | "CAD" | "SGD";

export type SalaryVisibility = "show" | "hide";

export type BenefitOption =
  | "Health Insurance"
  | "Retirement"
  | "Paid Time Off"
  | "Remote Work"
  | "Training"
  | "Certification Support"
  | "Other";

export type JobSortOption =
  | "newest"
  | "oldest"
  | "most_applications"
  | "deadline";

export type JobStatusFilter = "All" | JobStatus;

export type EmployerJobRecord = {
  id: string;
  title: string;
  company: string;
  logoUrl: string | null;
  employmentType: EmploymentType;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  location: string;
  workArrangement: WorkArrangement;
  sapModule: string;
  sapSpecialization: string;
  sapVersion: string;
  projectType: ProjectType | "";
  industry: string;
  description: string;
  responsibilities: string;
  requiredSkills: string;
  preferredSkills: string;
  minExperience: number;
  maxExperience: number | null;
  salaryType: SalaryType;
  minSalary: number | null;
  maxSalary: number | null;
  currency: Currency;
  salaryVisibility: SalaryVisibility;
  benefits: BenefitOption[];
  openings: number;
  deadline: string | null;
  recruiter: string;
  applicationEmail: string;
  externalUrl: string;
  status: JobStatus;
  applications: number;
  postedAt: string | null;
  updatedAt: string;
  createdAt: string;
};

export type JobServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type JobAction =
  | "view"
  | "edit"
  | "preview"
  | "publish"
  | "duplicate"
  | "pause"
  | "resume"
  | "close"
  | "delete";
