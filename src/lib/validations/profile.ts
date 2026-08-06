import { z } from "zod";

export const personalProfileSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  phone: z.string().optional(),
  location: z.string().optional(),
  headline: z.string().optional(),
});

export type PersonalProfileValues = z.infer<typeof personalProfileSchema>;

export const candidateDetailsSchema = z.object({
  experienceYears: z.string().optional(),
  skills: z.string().optional(),
  education: z.string().optional(),
  certifications: z.string().optional(),
  summary: z.string().optional(),
});

export type CandidateDetailsValues = z.infer<typeof candidateDetailsSchema>;
