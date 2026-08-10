export type ApplicationStatus =
  | "new"
  | "reviewing"
  | "shortlisted"
  | "interview"
  | "hired"
  | "rejected";

export type ApplicationStatusFilter = "all" | ApplicationStatus;

export type ApplicationSortOption =
  | "newest"
  | "oldest"
  | "most_experience"
  | "recently_updated";

export type ApplicationAction =
  | "view"
  | "review"
  | "shortlist"
  | "reject"
  | "change_status";

export type ApplicationTimelineEvent = {
  id: string;
  label: string;
  date: string | null;
  status: ApplicationStatus | "applied" | "scheduled";
  completed: boolean;
};

export type WorkExperienceItem = {
  id: string;
  role: string;
  company: string;
  duration: string;
  description: string;
};

export type EducationItem = {
  id: string;
  degree: string;
  institution: string;
  year: string;
};

export type EmployerApplication = {
  id: string;
  candidateId: string;
  candidateName: string;
  avatarUrl: string | null;
  email: string;
  phone: string;
  location: string;
  currentRole: string;
  experienceYears: number;
  sapSkills: string[];
  certifications: string[];
  education: EducationItem[];
  languages: string[];
  summary: string;
  workExperience: WorkExperienceItem[];
  availability: string;
  expectedSalary: string;
  noticePeriod: string;
  appliedJobId: string;
  appliedJobTitle: string;
  sapModule: string;
  jobLocation: string;
  employmentType: string;
  workArrangement: string;
  applicationDate: string;
  updatedAt: string;
  status: ApplicationStatus;
  resumeName: string | null;
  /** Private storage path in candidate-resumes bucket (not a public URL). */
  resumePath: string | null;
  coverLetter: string | null;
  timeline: ApplicationTimelineEvent[];
  notes: string | null;
};

export type JobFilterOption = {
  id: string;
  title: string;
  sapModule: string;
  location: string;
  employmentType: string;
  workArrangement: string;
};

/** @deprecated use JobFilterOption */
export type MockJobOption = JobFilterOption;

export type ApplicationSummaryStats = {
  total: number;
  new: number;
  reviewing: number;
  shortlisted: number;
  interview: number;
  hired: number;
  rejected: number;
};

export type ApplicationQuery = {
  search?: string;
  status?: ApplicationStatusFilter;
  jobId?: string;
  experience?: string;
  location?: string;
  sort?: ApplicationSortOption;
};

export type ApplicationServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
