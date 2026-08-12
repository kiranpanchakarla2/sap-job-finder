import type { Tables } from "@/types";
import type {
  CareerEducation,
  CareerExperience,
  CareerHighlight,
  CandidateResume,
  ResumeEmploymentType,
  ResumeFileType,
  ResumeStatus,
} from "../types/resume.types";

export type ResumeRow = Tables<"candidate_resumes">;
export type ExperienceRow = Tables<"candidate_experience">;
export type EducationRow = Tables<"candidate_education">;
export type HighlightRow = Tables<"candidate_career_highlights">;

function mapFileType(value: string | null | undefined): ResumeFileType {
  const upper = (value ?? "").toUpperCase();
  if (upper === "DOC") return "DOC";
  if (upper === "DOCX") return "DOCX";
  return "PDF";
}

export function mapResumeRow(row: ResumeRow): CandidateResume {
  const storagePath = row.storage_path || row.resume_url;
  return {
    id: row.id,
    fileName: row.original_file_name || row.resume_name,
    fileType: mapFileType(row.file_type),
    fileSize: row.file_size ?? 0,
    uploadedAt: row.created_at,
    isCurrent: row.is_primary,
    status: (row.is_primary ? "Ready" : "Archived") as ResumeStatus,
    storagePath,
    mimeType: row.mime_type,
    previewUrl: null,
  };
}

export function mapExperienceRow(row: ExperienceRow): CareerExperience {
  return {
    id: row.id,
    jobTitle: row.designation,
    company: row.company,
    location: row.location ?? "",
    employmentType: (row.employment_type as ResumeEmploymentType) || "Full-time",
    startDate: row.start_date,
    endDate: row.end_date ?? "",
    currentlyWorking: row.currently_working,
    description: row.description ?? "",
  };
}

export function mapEducationRow(row: EducationRow): CareerEducation {
  const startDate =
    row.start_date ||
    (row.start_year != null ? `${row.start_year}-01-01` : "");
  const endDate =
    row.end_date ||
    (row.end_year != null ? `${row.end_year}-12-31` : "");

  return {
    id: row.id,
    degree: row.degree,
    fieldOfStudy: row.field_of_study ?? "",
    institution: row.college,
    location: row.location ?? "",
    startDate,
    endDate,
    grade: row.grade ?? (row.percentage != null ? String(row.percentage) : ""),
  };
}

export function mapHighlightRow(row: HighlightRow): CareerHighlight {
  return {
    id: row.id,
    text: row.content,
    order: row.display_order,
  };
}

export function experienceToDb(input: Omit<CareerExperience, "id">) {
  return {
    designation: input.jobTitle.trim(),
    company: input.company.trim(),
    location: input.location.trim() || null,
    employment_type: input.employmentType || null,
    start_date: input.startDate,
    end_date: input.currentlyWorking ? null : input.endDate || null,
    currently_working: input.currentlyWorking,
    description: input.description.trim() || null,
  };
}

export function educationToDb(input: Omit<CareerEducation, "id">) {
  const startYear = input.startDate
    ? new Date(input.startDate).getFullYear()
    : null;
  const endYear = input.endDate
    ? new Date(input.endDate).getFullYear()
    : null;

  return {
    degree: input.degree.trim(),
    college: input.institution.trim(),
    university: null as string | null,
    field_of_study: input.fieldOfStudy.trim() || null,
    location: input.location.trim() || null,
    grade: input.grade.trim() || null,
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    start_year: Number.isFinite(startYear) ? startYear : null,
    end_year: Number.isFinite(endYear) ? endYear : null,
  };
}
