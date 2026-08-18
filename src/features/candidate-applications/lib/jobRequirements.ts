import type {
  ApplicationQuestion,
  JobApplicationRequirements,
} from "../types/application.types";
import { COVER_LETTER_MAX } from "../constants";

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
    placeholder: "e.g. 5",
  },
  {
    id: "q-s4hana",
    type: "yesNo",
    question: "Have you worked on SAP S/4HANA migration or greenfield projects?",
    required: true,
  },
  {
    id: "q-notice-abap",
    type: "singleSelect",
    question: "What is your notice period?",
    required: true,
    options: ["Immediate", "15 Days", "30 Days", "60 Days", "90 Days"],
  },
];

const LIGHT_QUESTIONS: ApplicationQuestion[] = [
  {
    id: "q-exp",
    type: "number",
    question: "Total years of professional SAP experience?",
    required: true,
    placeholder: "e.g. 3",
  },
  {
    id: "q-relocate",
    type: "yesNo",
    question: "Are you open to relocation if required?",
    required: true,
  },
];

export const DEFAULT_JOB_APPLICATION_REQUIREMENTS: JobApplicationRequirements = {
  requiresResume: true,
  requiresCoverLetter: false,
  coverLetterMinChars: 50,
  coverLetterMaxChars: COVER_LETTER_MAX,
  questions: LIGHT_QUESTIONS,
};

/** Infer application requirements and screening questions dynamically from job title. */
export function resolveJobApplicationRequirements(
  _jobId: string,
  title?: string,
): JobApplicationRequirements {
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
