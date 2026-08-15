/**
 * Candidate application models — Sprint 4 Phase A (local/mock).
 * Phase B maps these to applications / application_answers / status history.
 * 
 * NOTE: These are the FRONTEND-FACING status values.
 * The database stores: 'new' → 'applied', 'reviewing' → 'under_review', etc.
 * See normalizeApplicationStatus() for the mapping.
 */

export type ApplicationStatus =
  | "applied"
  | "under_review"
  | "shortlisted"
  | "interview"
  | "offer"
  | "hired"
  | "rejected"
  | "withdrawn";

/** Database status values (from Sprint 4B) */
export type DatabaseApplicationStatus =
  | "new"
  | "reviewing"
  | "shortlisted"
  | "interview"
  | "hired"
  | "rejected"
  | "withdrawn";

export type ApplicationQuestionType =
  | "text"
  | "textarea"
  | "number"
  | "yesNo"
  | "singleSelect"
  | "multiSelect";

export type ApplicationQuestion = {
  id: string;
  type: ApplicationQuestionType;
  question: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
};

export type ApplicationAnswer = {
  questionId: string;
  answer: string | number | boolean | string[] | null;
};

export type ApplicationTimelineEvent = {
  status: ApplicationStatus;
  timestamp: string;
  label: string;
};

/** Snapshot so history survives if the live job becomes unavailable. */
export type ApplicationJobSnapshot = {
  jobId: string;
  title: string;
  companyName: string;
  companyLogo: string;
  companyLogoColor: string;
  companyLogoUrl?: string | null;
  location: string;
  workMode: string;
  employmentType: string;
  experienceLabel: string;
  salaryLabel: string;
};

export type ApplicationResumeRef = {
  resumeId: string;
  label: string;
  fileName: string;
  updatedAt: string;
  skills: string[];
};

export type CandidateApplication = {
  id: string;
  candidateId: string;
  jobId: string;
  job: ApplicationJobSnapshot;
  resumeId: string;
  resume: ApplicationResumeRef;
  coverLetter: string;
  answers: ApplicationAnswer[];
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  withdrawnAt: string | null;
  timeline: ApplicationTimelineEvent[];
};

export type ApplicationDraft = {
  jobId: string;
  resumeId: string | null;
  coverLetter: string;
  answers: Record<string, string | number | boolean | string[] | null>;
  currentStep: ApplicationStepId;
  lastSavedAt: string;
};

export type ApplicationStepId =
  | "details"
  | "resume"
  | "coverLetter"
  | "questions"
  | "review";

export type JobApplicationRequirements = {
  requiresResume: boolean;
  requiresCoverLetter: boolean;
  coverLetterMinChars: number;
  coverLetterMaxChars: number;
  questions: ApplicationQuestion[];
};

export type ApplicationSortOption = "recent" | "oldest" | "status";

export type ApplicationListFilters = {
  status: ApplicationStatus | "all";
  query: string;
  jobType: string;
  location: string;
  dateApplied: "all" | "7d" | "30d" | "90d";
  sort: ApplicationSortOption;
};

export const DEFAULT_APPLICATION_FILTERS: ApplicationListFilters = {
  status: "all",
  query: "",
  jobType: "",
  location: "",
  dateApplied: "all",
  sort: "recent",
};

export type SelectableResume = {
  id: string;
  label: string;
  fileName: string;
  updatedAt: string;
  skills: string[];
  isCurrent: boolean;
};
