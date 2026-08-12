export type ResumeFileType = "PDF" | "DOC" | "DOCX";

export type ResumeStatus = "Ready" | "Processing" | "Archived";

export type ResumeEmploymentType =
  | "Full-time"
  | "Part-time"
  | "Contract"
  | "Internship";

export type CandidateResume = {
  id: string;
  fileName: string;
  fileType: ResumeFileType;
  /** Size in bytes */
  fileSize: number;
  uploadedAt: string;
  isCurrent: boolean;
  status: ResumeStatus;
  /** Private storage path — never a signed URL */
  storagePath: string;
  mimeType?: string | null;
  /** Ephemeral preview URL (signed or blob) — not persisted */
  previewUrl?: string | null;
};

export type CareerExperience = {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  employmentType: ResumeEmploymentType;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  description: string;
};

export type CareerEducation = {
  id: string;
  degree: string;
  fieldOfStudy: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  grade: string;
};

export type CareerHighlight = {
  id: string;
  text: string;
  order: number;
};

export type ResumeScoreInsight = {
  score: number;
  label: string;
  tip: string;
};

export type ResumeCareerState = {
  resumes: CandidateResume[];
  currentResumeId: string | null;
  experience: CareerExperience[];
  education: CareerEducation[];
  careerHighlights: CareerHighlight[];
  resumeScore: ResumeScoreInsight;
};

export type ExperienceFieldErrors = Partial<{
  jobTitle: string;
  company: string;
  startDate: string;
}>;

export type EducationFieldErrors = Partial<{
  degree: string;
  institution: string;
  startDate: string;
}>;
