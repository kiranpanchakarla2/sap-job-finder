import type { CompanySize } from "@/types/employer";
import type { CompanyProfile } from "../types/company.types";

export type CompanyProfileRow = {
  id: string;
  user_id: string;
  company_name: string;
  logo_url: string | null;
  website: string;
  industry: string;
  company_size: string;
  country: string;
  state: string;
  city: string;
  address: string;
  about: string;
  recruiter_name: string;
  designation: string;
  work_email: string;
  phone: string;
  setup_complete: boolean;
  created_at: string;
  updated_at: string;
};

export function mapCompanyProfileRow(row: CompanyProfileRow): CompanyProfile {
  return {
    id: row.id,
    employerId: row.user_id,
    companyName: row.company_name,
    logoUrl: row.logo_url,
    website: row.website ?? "",
    industry: row.industry ?? "",
    companySize: (row.company_size || "") as CompanySize | "",
    country: row.country ?? "",
    state: row.state ?? "",
    city: row.city ?? "",
    address: row.address ?? "",
    about: row.about ?? "",
    recruiterName: row.recruiter_name ?? "",
    designation: row.designation ?? "",
    workEmail: row.work_email ?? "",
    phone: row.phone ?? "",
    setupComplete: Boolean(row.setup_complete),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toCompanyProfileInsert(input: {
  userId: string;
  companyName: string;
  logoUrl: string | null;
  website: string;
  industry: string;
  companySize: string;
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
}) {
  return {
    user_id: input.userId,
    company_name: input.companyName,
    logo_url: input.logoUrl,
    website: input.website,
    industry: input.industry,
    company_size: input.companySize,
    country: input.country,
    state: input.state,
    city: input.city,
    address: input.address,
    about: input.about,
    recruiter_name: input.recruiterName,
    designation: input.designation,
    work_email: input.workEmail,
    phone: input.phone,
    setup_complete: input.setupComplete,
  };
}
