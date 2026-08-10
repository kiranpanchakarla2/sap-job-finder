import type { CompanySize } from "@/types/employer";

export type CompanyProfile = {
  id: string;
  employerId: string;
  companyName: string;
  logoUrl: string | null;
  website: string;
  industry: string;
  companySize: CompanySize | "";
  country: string;
  state: string;
  city: string;
  address: string;
  about: string;
  recruiterName: string;
  designation: string;
  workEmail: string;
  phone: string;
  setupComplete: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CompanyInformationInput = {
  companyName: string;
  logoUrl: string | null;
  website: string;
  industry: string;
  companySize: CompanySize | "";
};

export type CompanyDetailsInput = {
  country: string;
  state: string;
  city: string;
  address: string;
  about: string;
};

export type RecruiterInformationInput = {
  recruiterName: string;
  designation: string;
  workEmail: string;
  phone: string;
};

export type CompanyOnboardingInput = CompanyInformationInput &
  CompanyDetailsInput &
  RecruiterInformationInput;

export type CompanyProfileUpdateInput = Partial<
  Omit<CompanyProfile, "id" | "employerId" | "createdAt" | "updatedAt" | "setupComplete">
>;

export type CompanyServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type LogoUploadState = "idle" | "uploading" | "uploaded" | "error";
