import type { ApplicationStatus, ApplicationStepId, DatabaseApplicationStatus } from "./types/application.types";

export const APPLICATION_STORAGE_KEY = "sapjobsfinder-candidate-applications-v1";
export const APPLICATION_DRAFTS_STORAGE_KEY = "sapjobsfinder-candidate-application-drafts-v1";

export const COVER_LETTER_MAX = 3000;

export const APPLICATION_STEPS: {
  id: ApplicationStepId;
  label: string;
  shortLabel: string;
}[] = [
  { id: "details", label: "Application Details", shortLabel: "Details" },
  { id: "resume", label: "Resume", shortLabel: "Resume" },
  { id: "coverLetter", label: "Cover Letter", shortLabel: "Cover Letter" },
  { id: "questions", label: "Questions", shortLabel: "Questions" },
  { id: "review", label: "Review", shortLabel: "Review" },
];

export type ApplicationStatusConfig = {
  value: ApplicationStatus;
  label: string;
  description: string;
  badgeClass: string;
  canWithdraw: boolean;
};

/**
 * Normalize database status to frontend status.
 * The database uses Sprint 4B terminology: 'new', 'reviewing', etc.
 * The frontend uses candidate-friendly terminology: 'applied', 'under_review', etc.
 */
export function normalizeApplicationStatus(dbStatus: string): ApplicationStatus {
  const mapping: Record<string, ApplicationStatus> = {
    "new": "applied",
    "reviewing": "under_review",
    "shortlisted": "shortlisted",
    "interview": "interview",
    "hired": "hired",
    "rejected": "rejected",
    "withdrawn": "withdrawn",
    // Also support frontend status in case it's passed directly
    "applied": "applied",
    "under_review": "under_review",
    "offer": "offer",
  };
  return (mapping[dbStatus] as ApplicationStatus) || "applied";
}

export const APPLICATION_STATUS_CONFIG: Record<ApplicationStatus, ApplicationStatusConfig> = {
  applied: {
    value: "applied",
    label: "Applied",
    description: "Your application has been submitted.",
    badgeClass: "bg-primary/10 text-primary",
    canWithdraw: true,
  },
  under_review: {
    value: "under_review",
    label: "Under Review",
    description: "The employer is reviewing your application.",
    badgeClass: "bg-sky-500/10 text-sky-700",
    canWithdraw: true,
  },
  shortlisted: {
    value: "shortlisted",
    label: "Shortlisted",
    description: "You have been shortlisted for this role.",
    badgeClass: "bg-violet-500/10 text-violet-700",
    canWithdraw: true,
  },
  interview: {
    value: "interview",
    label: "Interview",
    description: "Interview stage in progress.",
    badgeClass: "bg-amber-500/10 text-amber-800",
    canWithdraw: true,
  },
  offer: {
    value: "offer",
    label: "Offer",
    description: "An offer has been extended.",
    badgeClass: "bg-emerald-500/10 text-emerald-700",
    canWithdraw: false,
  },
  hired: {
    value: "hired",
    label: "Hired",
    description: "You were hired for this role.",
    badgeClass: "bg-emerald-600/15 text-emerald-800",
    canWithdraw: false,
  },
  rejected: {
    value: "rejected",
    label: "Rejected",
    description: "This application was not selected.",
    badgeClass: "bg-rose-500/10 text-rose-700",
    canWithdraw: false,
  },
  withdrawn: {
    value: "withdrawn",
    label: "Withdrawn",
    description: "You withdrew this application.",
    badgeClass: "bg-muted/30 text-muted",
    canWithdraw: false,
  },
};

export function canWithdrawApplication(status: ApplicationStatus): boolean {
  return APPLICATION_STATUS_CONFIG[status].canWithdraw;
}

export const STATUS_FILTER_OPTIONS: Array<ApplicationStatus | "all"> = [
  "all",
  "applied",
  "under_review",
  "shortlisted",
  "interview",
  "offer",
  "hired",
  "rejected",
  "withdrawn",
];
