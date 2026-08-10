import { z } from "zod";
import { BENEFIT_OPTIONS } from "../constants";

const benefitSchema = z.enum(
  BENEFIT_OPTIONS as unknown as [string, ...string[]],
);

export const jobFormSchema = z.object({
  title: z.string().trim().min(1, "Job title is required."),
  employmentType: z.string().min(1, "Select an employment type."),
  jobType: z.string().min(1, "Select a job type."),
  experienceLevel: z.string().min(1, "Select an experience level."),
  location: z.string().trim().min(1, "Location is required."),
  workArrangement: z.string().min(1, "Select a work arrangement."),
  sapModule: z.string().min(1, "Select an SAP module."),
  sapSpecialization: z.string().default(""),
  sapVersion: z.string().default(""),
  projectType: z.string().default(""),
  industry: z.string().default(""),
  description: z.string().trim().min(1, "Job description is required."),
  responsibilities: z.string().trim().min(1, "Responsibilities are required."),
  requiredSkills: z.string().trim().min(1, "Required skills are required."),
  preferredSkills: z.string().default(""),
  minExperience: z
    .string()
    .trim()
    .min(1, "Enter the minimum years of experience.")
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) >= 0, {
      message: "Enter a valid minimum experience.",
    }),
  maxExperience: z.string().default(""),
  salaryType: z.string().default(""),
  minSalary: z.string().default(""),
  maxSalary: z.string().default(""),
  currency: z.string().default(""),
  salaryVisibility: z.enum(["show", "hide"]),
  benefits: z.array(benefitSchema).default([]),
  openings: z
    .string()
    .trim()
    .min(1, "Number of openings is required.")
    .refine((value) => Number.isInteger(Number(value)) && Number(value) >= 1, {
      message: "Enter at least 1 opening.",
    }),
  deadline: z.string().default(""),
  recruiter: z.string().default(""),
  applicationEmail: z.string().default(""),
  externalUrl: z.string().default(""),
});

export type JobFormValues = z.input<typeof jobFormSchema>;
export type JobFormParsedValues = z.output<typeof jobFormSchema>;
