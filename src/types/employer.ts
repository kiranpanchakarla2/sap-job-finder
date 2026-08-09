/**
 * Employer domain models for future entities:
 * employer_profiles, jobs, job_applications, subscriptions
 */

export type CompanySize =
  | "1-10"
  | "11-50"
  | "51-200"
  | "201-500"
  | "501-1000"
  | "1000+";

export type EmployerProfile = {
  id: string;
  userId: string;
  companyName: string;
  recruiterName: string;
  email: string;
  phone: string;
  website: string;
  companySize: CompanySize;
  industry: string;
};

export type EmployerJobStatus = "Active" | "Paused" | "Closed" | "Draft";

export type EmployerJob = {
  id: string;
  title: string;
  applications: number;
  views: number;
  status: EmployerJobStatus;
  postedAt: string;
  location: string;
  sapModule: string;
};

export type ApplicantStatus =
  | "New"
  | "Under Review"
  | "Shortlisted"
  | "Interview"
  | "Rejected"
  | "Hired";

export type EmployerApplicant = {
  id: string;
  name: string;
  sapModule: string;
  experience: string;
  location: string;
  appliedAt: string;
  status: ApplicantStatus;
  jobTitle: string;
};

export type EmployerRegisterInput = {
  companyName: string;
  recruiterName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  website: string;
  companySize: CompanySize;
  industry: string;
  terms: boolean;
};

export const COMPANY_SIZE_OPTIONS: { value: CompanySize; label: string }[] = [
  { value: "1-10", label: "1-10" },
  { value: "11-50", label: "11-50" },
  { value: "51-200", label: "51-200" },
  { value: "201-500", label: "201-500" },
  { value: "501-1000", label: "501-1000" },
  { value: "1000+", label: "1000+" },
];

export const INDUSTRY_OPTIONS: { value: string; label: string }[] = [
  { value: "IT Services", label: "IT Services" },
  { value: "Consulting", label: "Consulting" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Retail", label: "Retail" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Finance & Banking", label: "Finance & Banking" },
  { value: "Logistics", label: "Logistics" },
  { value: "Energy", label: "Energy" },
  { value: "Telecommunications", label: "Telecommunications" },
  { value: "Other", label: "Other" },
];
