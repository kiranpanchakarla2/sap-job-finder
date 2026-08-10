import type { BenefitOption, EmployerJobRecord } from "../types/job.types";
import type { JobFormValues } from "./validation";

export function formatDisplayDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatExperienceRange(
  min: number,
  max: number | null | undefined,
): string {
  if (max == null) return `${min}+ years`;
  if (min === max) return `${min} years`;
  return `${min}–${max} years`;
}

export function formatSalary(job: EmployerJobRecord): string {
  if (job.salaryVisibility === "hide") return "Compensation details available upon request";
  if (job.salaryType === "Negotiable") return "Negotiable";
  if (job.salaryType === "Not specified") return "Not specified";

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: job.currency || "USD",
    maximumFractionDigits: 0,
  });

  if (job.minSalary != null && job.maxSalary != null) {
    return `${formatter.format(job.minSalary)} – ${formatter.format(job.maxSalary)}`;
  }
  if (job.minSalary != null) return `From ${formatter.format(job.minSalary)}`;
  if (job.maxSalary != null) return `Up to ${formatter.format(job.maxSalary)}`;
  return "Not specified";
}

export function formatMultilineText(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function emptyJobFormValues(defaults?: {
  recruiter?: string;
  applicationEmail?: string;
}): JobFormValues {
  return {
    title: "",
    employmentType: "",
    jobType: "",
    experienceLevel: "",
    location: "",
    workArrangement: "",
    sapModule: "",
    sapSpecialization: "",
    sapVersion: "",
    projectType: "",
    industry: "",
    description: "",
    responsibilities: "",
    requiredSkills: "",
    preferredSkills: "",
    minExperience: "",
    maxExperience: "",
    salaryType: "Range",
    minSalary: "",
    maxSalary: "",
    currency: "INR",
    salaryVisibility: "show",
    benefits: [],
    openings: "1",
    deadline: "",
    recruiter: defaults?.recruiter ?? "",
    applicationEmail: defaults?.applicationEmail ?? "",
    externalUrl: "",
  };
}

export function jobToFormValues(job: EmployerJobRecord): JobFormValues {
  return {
    title: job.title,
    employmentType: job.employmentType,
    jobType: job.jobType,
    experienceLevel: job.experienceLevel,
    location: job.location,
    workArrangement: job.workArrangement,
    sapModule: job.sapModule,
    sapSpecialization: job.sapSpecialization,
    sapVersion: job.sapVersion,
    projectType: job.projectType,
    industry: job.industry,
    description: job.description,
    responsibilities: job.responsibilities,
    requiredSkills: job.requiredSkills,
    preferredSkills: job.preferredSkills,
    minExperience: String(job.minExperience),
    maxExperience: job.maxExperience == null ? "" : String(job.maxExperience),
    salaryType: job.salaryType,
    minSalary: job.minSalary == null ? "" : String(job.minSalary),
    maxSalary: job.maxSalary == null ? "" : String(job.maxSalary),
    currency: job.currency,
    salaryVisibility: job.salaryVisibility,
    benefits: [...job.benefits],
    openings: String(job.openings),
    deadline: job.deadline ?? "",
    recruiter: job.recruiter,
    applicationEmail: job.applicationEmail,
    externalUrl: job.externalUrl,
  };
}

export function formValuesToJobFields(values: JobFormValues) {
  const maxExperienceRaw = (values.maxExperience ?? "").trim();
  const minSalaryRaw = (values.minSalary ?? "").trim();
  const maxSalaryRaw = (values.maxSalary ?? "").trim();

  return {
    title: values.title.trim(),
    employmentType: values.employmentType as EmployerJobRecord["employmentType"],
    jobType: values.jobType as EmployerJobRecord["jobType"],
    experienceLevel: values.experienceLevel as EmployerJobRecord["experienceLevel"],
    location: values.location.trim(),
    workArrangement: values.workArrangement as EmployerJobRecord["workArrangement"],
    sapModule: values.sapModule,
    sapSpecialization: (values.sapSpecialization ?? "").trim(),
    sapVersion: (values.sapVersion ?? "").trim(),
    projectType: (values.projectType || "") as EmployerJobRecord["projectType"],
    industry: (values.industry ?? "").trim(),
    description: values.description.trim(),
    responsibilities: values.responsibilities.trim(),
    requiredSkills: values.requiredSkills.trim(),
    preferredSkills: (values.preferredSkills ?? "").trim(),
    minExperience: Number(values.minExperience),
    maxExperience: maxExperienceRaw === "" ? null : Number(maxExperienceRaw),
    salaryType: (values.salaryType || "Not specified") as EmployerJobRecord["salaryType"],
    minSalary: minSalaryRaw === "" ? null : Number(minSalaryRaw),
    maxSalary: maxSalaryRaw === "" ? null : Number(maxSalaryRaw),
    currency: (values.currency || "USD") as EmployerJobRecord["currency"],
    salaryVisibility: values.salaryVisibility,
    benefits: (values.benefits ?? []) as BenefitOption[],
    openings: Number(values.openings),
    deadline: (values.deadline ?? "").trim() || null,
    recruiter: (values.recruiter ?? "").trim(),
    applicationEmail: (values.applicationEmail ?? "").trim(),
    externalUrl: (values.externalUrl ?? "").trim(),
  };
}
