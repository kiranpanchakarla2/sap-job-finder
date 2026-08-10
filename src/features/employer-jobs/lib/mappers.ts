import type { Json } from "@/types/database";
import type { BenefitOption, EmployerJobRecord, JobStatus } from "../types/job.types";
import type { JobFormValues } from "./validation";
import { formValuesToJobFields } from "./format";

/** DB job status (lowercase). */
export type DbJobStatus = "draft" | "active" | "paused" | "closed";

export type JobRow = {
  id: string;
  company_id: string;
  employer_id: string;
  created_by: string;
  title: string;
  employment_type: string;
  job_type: string;
  experience_level: string;
  location: string;
  work_arrangement: string;
  sap_module: string;
  sap_specialization: string | null;
  sap_version: string | null;
  project_type: string | null;
  industry: string | null;
  description: string;
  responsibilities: string;
  required_skills: string;
  preferred_skills: string | null;
  minimum_experience: number;
  maximum_experience: number | null;
  salary_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  salary_visible: boolean;
  benefits: Json;
  number_of_openings: number;
  application_deadline: string | null;
  recruiter_name: string | null;
  application_email: string | null;
  application_url: string | null;
  status: DbJobStatus | string;
  published_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type JobRowWithRelations = JobRow;

const STATUS_TO_UI: Record<string, JobStatus> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  closed: "Closed",
};

const STATUS_TO_DB: Record<JobStatus, DbJobStatus> = {
  Draft: "draft",
  Active: "active",
  Paused: "paused",
  Closed: "closed",
};

export function toUiJobStatus(status: string): JobStatus {
  return STATUS_TO_UI[status] ?? "Draft";
}

export function toDbJobStatus(status: JobStatus): DbJobStatus {
  return STATUS_TO_DB[status];
}

function parseBenefits(value: Json): BenefitOption[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is BenefitOption => typeof item === "string");
}

function publishedDateOnly(publishedAt: string | null): string | null {
  if (!publishedAt) return null;
  return publishedAt.slice(0, 10);
}

export function mapJobRow(
  row: JobRow,
  company?: { companyName?: string; logoUrl?: string | null } | null,
  applications = 0,
): EmployerJobRecord {
  return {
    id: row.id,
    title: row.title,
    company: company?.companyName || "Your company",
    logoUrl: company?.logoUrl ?? null,
    employmentType: row.employment_type as EmployerJobRecord["employmentType"],
    jobType: row.job_type as EmployerJobRecord["jobType"],
    experienceLevel: row.experience_level as EmployerJobRecord["experienceLevel"],
    location: row.location,
    workArrangement: row.work_arrangement as EmployerJobRecord["workArrangement"],
    sapModule: row.sap_module,
    sapSpecialization: row.sap_specialization ?? "",
    sapVersion: row.sap_version ?? "",
    projectType: (row.project_type || "") as EmployerJobRecord["projectType"],
    industry: row.industry ?? "",
    description: row.description,
    responsibilities: row.responsibilities,
    requiredSkills: row.required_skills,
    preferredSkills: row.preferred_skills ?? "",
    minExperience: row.minimum_experience,
    maxExperience: row.maximum_experience,
    salaryType: (row.salary_type || "Not specified") as EmployerJobRecord["salaryType"],
    minSalary: row.salary_min == null ? null : Number(row.salary_min),
    maxSalary: row.salary_max == null ? null : Number(row.salary_max),
    currency: (row.currency || "USD") as EmployerJobRecord["currency"],
    salaryVisibility: row.salary_visible ? "show" : "hide",
    benefits: parseBenefits(row.benefits),
    openings: row.number_of_openings,
    deadline: row.application_deadline,
    recruiter: row.recruiter_name ?? "",
    applicationEmail: row.application_email ?? "",
    externalUrl: row.application_url ?? "",
    status: toUiJobStatus(row.status),
    applications,
    postedAt: publishedDateOnly(row.published_at),
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

export function formValuesToJobWrite(
  values: JobFormValues,
  options?: { status?: DbJobStatus },
) {
  const fields = formValuesToJobFields(values);
  const status = options?.status;

  return {
    title: fields.title,
    employment_type: fields.employmentType,
    job_type: fields.jobType,
    experience_level: fields.experienceLevel,
    location: fields.location,
    work_arrangement: fields.workArrangement,
    sap_module: fields.sapModule,
    sap_specialization: fields.sapSpecialization || null,
    sap_version: fields.sapVersion || null,
    project_type: fields.projectType || null,
    industry: fields.industry || null,
    description: fields.description,
    responsibilities: fields.responsibilities,
    required_skills: fields.requiredSkills,
    preferred_skills: fields.preferredSkills || null,
    minimum_experience: fields.minExperience,
    maximum_experience: fields.maxExperience,
    salary_type: fields.salaryType,
    salary_min: fields.minSalary,
    salary_max: fields.maxSalary,
    currency: fields.currency,
    salary_visible: fields.salaryVisibility === "show",
    benefits: fields.benefits,
    number_of_openings: fields.openings,
    application_deadline: fields.deadline,
    recruiter_name: fields.recruiter || null,
    application_email: fields.applicationEmail || null,
    application_url: fields.externalUrl || null,
    ...(status ? { status } : {}),
    ...(status === "active" ? { published_at: new Date().toISOString() } : {}),
  };
}

export const JOB_SELECT = "*";
