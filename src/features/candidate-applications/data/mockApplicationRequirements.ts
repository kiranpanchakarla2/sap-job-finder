import type {
  ApplicationQuestion,
  JobApplicationRequirements,
  SelectableResume,
} from "../types/application.types";
import { COVER_LETTER_MAX } from "../constants";

export const MOCK_SELECTABLE_RESUMES: SelectableResume[] = [
  {
    id: "resume-1",
    label: "SAP Fiori Resume",
    fileName: "Kiran_Panchakarla_SAP_Resume.pdf",
    updatedAt: "2026-08-10T10:00:00.000Z",
    skills: ["SAP Fiori", "SAP UI5", "Angular", "BTP"],
    isCurrent: true,
  },
  {
    id: "resume-2",
    label: "SAP Technical Resume",
    fileName: "Kiran_SAP_Resume_March_2026.pdf",
    updatedAt: "2026-07-28T09:00:00.000Z",
    skills: ["ABAP", "S/4HANA", "CDS", "RAP"],
    isCurrent: false,
  },
];

const FIORI_QUESTIONS: ApplicationQuestion[] = [
  {
    id: "q-fiori-years",
    type: "number",
    question: "How many years of SAP Fiori experience do you have?",
    required: true,
    placeholder: "e.g. 4",
  },
  {
    id: "q-hybrid",
    type: "yesNo",
    question: "Are you willing to work in a hybrid environment?",
    required: true,
  },
  {
    id: "q-btp",
    type: "textarea",
    question: "Describe your experience with SAP BTP.",
    required: false,
    placeholder: "Share relevant projects or modules…",
  },
  {
    id: "q-notice",
    type: "singleSelect",
    question: "What is your notice period?",
    required: true,
    options: ["Immediate", "15 Days", "30 Days", "60 Days", "90 Days"],
  },
];

const ABAP_QUESTIONS: ApplicationQuestion[] = [
  {
    id: "q-abap-years",
    type: "number",
    question: "How many years of SAP ABAP / RAP experience do you have?",
    required: true,
  },
  {
    id: "q-s4",
    type: "yesNo",
    question: "Have you worked on an S/4HANA implementation?",
    required: true,
  },
  {
    id: "q-skills",
    type: "multiSelect",
    question: "Which technologies have you used professionally?",
    required: true,
    options: ["OOABAP", "CDS", "RAP", "OData", "AMDP", "Fiori"],
  },
];

const LIGHT_QUESTIONS: ApplicationQuestion[] = [
  {
    id: "q-relocate",
    type: "yesNo",
    question: "Are you open to relocating for this role?",
    required: false,
  },
];

/** Default requirements when a job has no specific config. */
export const DEFAULT_JOB_APPLICATION_REQUIREMENTS: JobApplicationRequirements = {
  requiresResume: true,
  requiresCoverLetter: false,
  coverLetterMinChars: 50,
  coverLetterMaxChars: COVER_LETTER_MAX,
  questions: LIGHT_QUESTIONS,
};

/**
 * Per-job application configuration for Phase A.
 * Keys may match DiscoveryJob ids (mock or live). Unknown jobs use defaults.
 */
export const JOB_APPLICATION_REQUIREMENTS: Record<string, JobApplicationRequirements> = {
  "fiori-accenture-pune": {
    requiresResume: true,
    requiresCoverLetter: true,
    coverLetterMinChars: 80,
    coverLetterMaxChars: COVER_LETTER_MAX,
    questions: FIORI_QUESTIONS,
  },
  "fiori-techm-hyd": {
    requiresResume: true,
    requiresCoverLetter: false,
    coverLetterMinChars: 50,
    coverLetterMaxChars: COVER_LETTER_MAX,
    questions: [],
  },
  "abap-techm-hyd": {
    requiresResume: true,
    requiresCoverLetter: true,
    coverLetterMinChars: 60,
    coverLetterMaxChars: COVER_LETTER_MAX,
    questions: ABAP_QUESTIONS,
  },
  "abap-tcs-blr": {
    requiresResume: true,
    requiresCoverLetter: false,
    coverLetterMinChars: 50,
    coverLetterMaxChars: COVER_LETTER_MAX,
    questions: ABAP_QUESTIONS,
  },
  "integration-accenture-remote": {
    requiresResume: false,
    requiresCoverLetter: false,
    coverLetterMinChars: 50,
    coverLetterMaxChars: COVER_LETTER_MAX,
    questions: LIGHT_QUESTIONS,
  },
  "btp-deloitte-gg": {
    requiresResume: true,
    requiresCoverLetter: true,
    coverLetterMinChars: 100,
    coverLetterMaxChars: COVER_LETTER_MAX,
    questions: [
      {
        id: "q-arch",
        type: "textarea",
        question: "Summarize a BTP architecture decision you owned.",
        required: true,
      },
      {
        id: "q-travel",
        type: "yesNo",
        question: "Are you open to occasional client travel?",
        required: true,
      },
    ],
  },
};

export function getJobApplicationRequirements(jobId: string): JobApplicationRequirements {
  return JOB_APPLICATION_REQUIREMENTS[jobId] ?? DEFAULT_JOB_APPLICATION_REQUIREMENTS;
}

/** Infer richer requirements from title when job is from live Supabase catalog. */
export function resolveJobApplicationRequirements(
  jobId: string,
  title?: string,
): JobApplicationRequirements {
  const configured = JOB_APPLICATION_REQUIREMENTS[jobId];
  if (configured) return configured;

  const t = (title ?? "").toLowerCase();
  if (t.includes("fiori") || t.includes("ui5")) {
    return {
      requiresResume: true,
      requiresCoverLetter: true,
      coverLetterMinChars: 80,
      coverLetterMaxChars: COVER_LETTER_MAX,
      questions: FIORI_QUESTIONS,
    };
  }
  if (t.includes("abap") || t.includes("rap")) {
    return {
      requiresResume: true,
      requiresCoverLetter: false,
      coverLetterMinChars: 50,
      coverLetterMaxChars: COVER_LETTER_MAX,
      questions: ABAP_QUESTIONS,
    };
  }
  return DEFAULT_JOB_APPLICATION_REQUIREMENTS;
}
