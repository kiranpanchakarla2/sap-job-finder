import type { DiscoveryJob } from "@/features/candidate-jobs/types/job.types";
import { APPLICATION_STATUS_CONFIG } from "../constants";
import type {
  ApplicationDraft,
  ApplicationJobSnapshot,
  ApplicationListFilters,
  ApplicationStatus,
  CandidateApplication,
  JobApplicationRequirements,
  SelectableResume,
} from "../types/application.types";

export function toJobSnapshot(job: DiscoveryJob): ApplicationJobSnapshot {
  return {
    jobId: job.id,
    title: job.title,
    companyName: job.companyName,
    companyLogo: job.companyLogo,
    companyLogoColor: job.companyLogoColor,
    companyLogoUrl: job.companyLogoUrl,
    location: job.location,
    workMode: job.workMode,
    employmentType: job.employmentType,
    experienceLabel: job.experienceLabel,
    salaryLabel: job.salaryLabel,
  };
}

export function formatApplicationDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function createEmptyDraft(jobId: string): ApplicationDraft {
  return {
    jobId,
    resumeId: null,
    coverLetter: "",
    answers: {},
    currentStep: "details",
    lastSavedAt: new Date().toISOString(),
  };
}

export function nextApplicationId(existing: CandidateApplication[]): string {
  const year = new Date().getFullYear();
  let max = 0;
  for (const app of existing) {
    const match = app.id.match(/APP-\d+-(\d+)/i);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `APP-${year}-${String(max + 1).padStart(4, "0")}`;
}

export function computeApplicationStats(applications: CandidateApplication[]) {
  return {
    total: applications.length,
    underReview: applications.filter((a) => a.status === "under_review").length,
    interviews: applications.filter((a) => a.status === "interview").length,
    offers: applications.filter((a) => a.status === "offer" || a.status === "hired").length,
    applied: applications.filter((a) => a.status === "applied").length,
    withdrawn: applications.filter((a) => a.status === "withdrawn").length,
  };
}

export function filterApplications(
  applications: CandidateApplication[],
  filters: ApplicationListFilters,
): CandidateApplication[] {
  const q = filters.query.trim().toLowerCase();
  let result = applications.filter((app) => {
    if (filters.status !== "all" && app.status !== filters.status) return false;
    if (filters.location) {
      if (!app.job.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
    }
    if (filters.jobType) {
      if (!app.job.employmentType.toLowerCase().includes(filters.jobType.toLowerCase())) {
        return false;
      }
    }
    if (filters.dateApplied !== "all") {
      const applied = new Date(app.appliedAt).getTime();
      const now = Date.now();
      const days =
        filters.dateApplied === "7d" ? 7 : filters.dateApplied === "30d" ? 30 : 90;
      if (now - applied > days * 24 * 60 * 60 * 1000) return false;
    }
    if (q) {
      const hay = `${app.job.title} ${app.job.companyName} ${app.job.location}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  result = [...result].sort((a, b) => {
    if (filters.sort === "oldest") {
      return new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
    }
    if (filters.sort === "status") {
      return APPLICATION_STATUS_CONFIG[a.status].label.localeCompare(
        APPLICATION_STATUS_CONFIG[b.status].label,
      );
    }
    return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
  });

  return result;
}



export function validateStep(
  step: ApplicationDraft["currentStep"],
  draft: ApplicationDraft,
  requirements: JobApplicationRequirements,
  resumes: SelectableResume[],
): string | null {
  if (step === "resume") {
    if (requirements.requiresResume && !draft.resumeId) {
      return "Please select a resume to continue.";
    }
    if (draft.resumeId && !resumes.some((r) => r.id === draft.resumeId)) {
      return "Selected resume is unavailable.";
    }
  }

  if (step === "coverLetter") {
    if (requirements.requiresCoverLetter) {
      const len = draft.coverLetter.trim().length;
      if (len < requirements.coverLetterMinChars) {
        return `Cover letter is required for this application (min ${requirements.coverLetterMinChars} characters).`;
      }
    }
    if (draft.coverLetter.length > requirements.coverLetterMaxChars) {
      return `Cover letter must be under ${requirements.coverLetterMaxChars} characters.`;
    }
  }

  if (step === "questions") {
    for (const question of requirements.questions) {
      if (!question.required) continue;
      const value = draft.answers[question.id];
      if (value == null || value === "") {
        return "This question is required.";
      }
      if (Array.isArray(value) && value.length === 0) {
        return "This question is required.";
      }
    }
  }

  if (step === "review") {
    const resumeError = validateStep("resume", draft, requirements, resumes);
    if (resumeError) return resumeError;
    const coverError = validateStep("coverLetter", draft, requirements, resumes);
    if (coverError) return coverError;
    const questionError = validateStep("questions", draft, requirements, resumes);
    if (questionError) return questionError;
  }

  return null;
}

export function statusLabel(status: ApplicationStatus): string {
  return APPLICATION_STATUS_CONFIG[status].label;
}
