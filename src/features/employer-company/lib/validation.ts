import { z } from "zod";
import { COMPANY_ABOUT_MAX_LENGTH } from "../constants";

const companySizeSchema = z.enum(
  ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"],
  { error: "Company size is required." },
);

export const companyInformationSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is required."),
  logoUrl: z.string().nullable(),
  website: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^https?:\/\/.+/i.test(value) || /^[\w.-]+\.[\w.-]+/.test(value),
      "Enter a valid website URL.",
    ),
  industry: z.string().trim().min(1, "Industry is required."),
  companySize: companySizeSchema,
});

export const companyDetailsSchema = z.object({
  country: z.string().trim().min(1, "Country is required."),
  state: z.string().trim(),
  city: z.string().trim().min(1, "City is required."),
  address: z.string().trim(),
  about: z
    .string()
    .trim()
    .min(20, "About company must be at least 20 characters.")
    .max(COMPANY_ABOUT_MAX_LENGTH, `About company must be under ${COMPANY_ABOUT_MAX_LENGTH} characters.`),
});

export const recruiterInformationSchema = z.object({
  recruiterName: z.string().trim().min(2, "Recruiter name is required."),
  designation: z.string().trim().min(2, "Designation is required."),
  workEmail: z.string().trim().email("Enter a valid work email."),
  phone: z.string().trim(),
});

export const companyOnboardingSchema = companyInformationSchema
  .merge(companyDetailsSchema)
  .merge(recruiterInformationSchema);

export const companyProfileEditSchema = companyOnboardingSchema;

export type CompanyInformationValues = z.infer<typeof companyInformationSchema>;
export type CompanyDetailsValues = z.infer<typeof companyDetailsSchema>;
export type RecruiterInformationValues = z.infer<typeof recruiterInformationSchema>;
export type CompanyOnboardingValues = z.infer<typeof companyOnboardingSchema>;
export type CompanyProfileEditValues = z.infer<typeof companyProfileEditSchema>;
