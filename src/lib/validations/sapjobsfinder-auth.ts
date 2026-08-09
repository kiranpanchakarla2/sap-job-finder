import { z } from "zod";
import type { ExperienceBand, SapModuleOption } from "@/types/candidate";
import type { CompanySize } from "@/types/employer";

const emailField = z
  .string()
  .min(1, "Email is required")
  .pipe(z.email("Enter a valid email address"));

const passwordField = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters");

const phoneField = z
  .string()
  .min(1, "Mobile number is required")
  .regex(/^[\d\s+\-()]{8,20}$/, "Enter a valid mobile number");

const experienceValues = [
  "Fresher",
  "0-2 years",
  "2-5 years",
  "5-8 years",
  "8-12 years",
  "12+ years",
] as const satisfies readonly ExperienceBand[];

const sapModuleValues = [
  "SAP ABAP",
  "SAP FICO",
  "SAP MM",
  "SAP SD",
  "SAP PP",
  "SAP HCM",
  "SAP SuccessFactors",
  "SAP Basis",
  "SAP BW",
  "SAP BTP",
  "SAP EWM",
  "SAP TM",
  "SAP Ariba",
  "Other",
] as const satisfies readonly SapModuleOption[];

const companySizeValues = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
] as const satisfies readonly CompanySize[];

const industryValues = [
  "IT Services",
  "Consulting",
  "Manufacturing",
  "Retail",
  "Healthcare",
  "Finance & Banking",
  "Logistics",
  "Energy",
  "Telecommunications",
  "Other",
] as const;

export const candidateLoginSchema = z.object({
  email: emailField,
  password: passwordField,
});

export type CandidateLoginValues = z.infer<typeof candidateLoginSchema>;

export const employerLoginSchema = z.object({
  email: emailField,
  password: passwordField,
});

export type EmployerLoginValues = z.infer<typeof employerLoginSchema>;

export const candidateRegisterSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").min(2, "Enter a valid first name"),
    lastName: z.string().min(1, "Last name is required").min(2, "Enter a valid last name"),
    email: emailField,
    phone: phoneField,
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirm your password"),
    location: z.string().min(1, "Current location is required"),
    experience: z.enum(experienceValues, { message: "Select years of experience" }),
    sapModule: z.enum(sapModuleValues, { message: "Select an SAP module" }),
    terms: z.boolean().refine((value) => value === true, {
      message: "Please agree to the Terms to continue",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type CandidateRegisterValues = z.infer<typeof candidateRegisterSchema>;

export const employerRegisterSchema = z
  .object({
    companyName: z.string().min(1, "Company name is required").min(2, "Enter a valid company name"),
    recruiterName: z
      .string()
      .min(1, "Recruiter name is required")
      .min(2, "Enter a valid recruiter name"),
    email: emailField,
    phone: phoneField,
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirm your password"),
    website: z
      .string()
      .min(1, "Company website is required")
      .refine(
        (value) => {
          try {
            const url = value.startsWith("http") ? value : `https://${value}`;
            new URL(url);
            return true;
          } catch {
            return false;
          }
        },
        { message: "Enter a valid website URL" },
      ),
    companySize: z.enum(companySizeValues, { message: "Select company size" }),
    industry: z.enum(industryValues, { message: "Select an industry" }),
    terms: z.boolean().refine((value) => value === true, {
      message: "Please agree to the Terms to continue",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type EmployerRegisterValues = z.infer<typeof employerRegisterSchema>;

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
