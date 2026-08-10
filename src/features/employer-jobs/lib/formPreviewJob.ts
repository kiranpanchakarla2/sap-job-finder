import type { EmployerJobRecord } from "../types/job.types";
import type { JobFormValues } from "./validation";
import { formValuesToJobFields } from "./format";

/** Build a preview-only job record from unsaved form state (no Supabase row). */
export function formValuesToPreviewJob(
  values: JobFormValues,
  company: { companyName: string; logoUrl: string | null },
): EmployerJobRecord {
  const fields = formValuesToJobFields(values);
  const now = new Date().toISOString();

  return {
    id: "preview-local",
    title: fields.title,
    company: company.companyName,
    logoUrl: company.logoUrl,
    employmentType: fields.employmentType,
    jobType: fields.jobType,
    experienceLevel: fields.experienceLevel,
    location: fields.location,
    workArrangement: fields.workArrangement,
    sapModule: fields.sapModule,
    sapSpecialization: fields.sapSpecialization,
    sapVersion: fields.sapVersion,
    projectType: fields.projectType,
    industry: fields.industry,
    description: fields.description,
    responsibilities: fields.responsibilities,
    requiredSkills: fields.requiredSkills,
    preferredSkills: fields.preferredSkills,
    minExperience: fields.minExperience,
    maxExperience: fields.maxExperience,
    salaryType: fields.salaryType,
    minSalary: fields.minSalary,
    maxSalary: fields.maxSalary,
    currency: fields.currency,
    salaryVisibility: fields.salaryVisibility,
    benefits: fields.benefits,
    openings: fields.openings,
    deadline: fields.deadline,
    recruiter: fields.recruiter,
    applicationEmail: fields.applicationEmail,
    externalUrl: fields.externalUrl,
    status: "Draft",
    applications: 0,
    postedAt: null,
    updatedAt: now,
    createdAt: now,
  };
}
