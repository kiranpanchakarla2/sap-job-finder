import type { Json } from "@/types/database";
import type {
  DiscoveryJob,
  EmploymentType,
  JobStatus,
  WorkMode,
} from "../types/job.types";

export type DiscoveryCompanyJoin = {
  id: string;
  company_name: string;
  logo_url: string | null;
  about: string | null;
  industry: string | null;
  company_size: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  website: string | null;
  setup_complete: boolean | null;
};

export type DiscoveryJobRow = {
  id: string;
  company_id: string;
  title: string;
  employment_type: string;
  job_type: string;
  experience_level: string;
  location: string;
  work_arrangement: string;
  sap_module: string;
  sap_specialization: string | null;
  industry: string | null;
  description: string;
  responsibilities: string;
  required_skills: string;
  preferred_skills: string | null;
  minimum_experience: number;
  maximum_experience: number | null;
  salary_type: string | null;
  salary_min: number | string | null;
  salary_max: number | string | null;
  currency: string | null;
  salary_visible: boolean;
  benefits: Json;
  application_deadline: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  company_profiles?: DiscoveryCompanyJoin | DiscoveryCompanyJoin[] | null;
};

const LIST_COLUMNS = [
  "id",
  "company_id",
  "title",
  "employment_type",
  "job_type",
  "experience_level",
  "location",
  "work_arrangement",
  "sap_module",
  "sap_specialization",
  "industry",
  "description",
  "responsibilities",
  "required_skills",
  "preferred_skills",
  "minimum_experience",
  "maximum_experience",
  "salary_type",
  "salary_min",
  "salary_max",
  "currency",
  "salary_visible",
  "benefits",
  "application_deadline",
  "status",
  "published_at",
  "created_at",
  "updated_at",
].join(", ");

const COMPANY_EMBED = `company_profiles (
  id,
  company_name,
  logo_url,
  about,
  industry,
  company_size,
  city,
  state,
  country,
  website,
  setup_complete
)`;

/** Lightweight list select — still includes short description for keyword context in mapper. */
export const JOB_CARD_SELECT = `${LIST_COLUMNS},${COMPANY_EMBED}`.replace(/\s+/g, " ");

export const JOB_DETAIL_SELECT = JOB_CARD_SELECT;

/** Flat select for saved_jobs → jobs embed (avoids nested template parser issues). */
export const SAVED_JOB_EMBED_SELECT = `
created_at,
job_id,
jobs (
  id,
  company_id,
  title,
  employment_type,
  job_type,
  experience_level,
  location,
  work_arrangement,
  sap_module,
  sap_specialization,
  industry,
  description,
  responsibilities,
  required_skills,
  preferred_skills,
  minimum_experience,
  maximum_experience,
  salary_type,
  salary_min,
  salary_max,
  currency,
  salary_visible,
  benefits,
  application_deadline,
  status,
  published_at,
  created_at,
  updated_at,
  company_profiles (
    id,
    company_name,
    logo_url,
    about,
    industry,
    company_size,
    city,
    state,
    country,
    website,
    setup_complete
  )
)
`.replace(/\s+/g, " ").trim();

function asCompany(
  value: DiscoveryJobRow["company_profiles"],
): DiscoveryCompanyJoin | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function splitList(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/[,;\n•]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBenefits(value: Json): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Normalize employer salary storage (absolute INR or LPA) to LPA for UI/filters. */
export function toLpa(value: number | null): number | null {
  if (value == null) return null;
  if (value >= 1000) return Math.round(value / 100_000);
  return value;
}

export function formatSalaryLabel(
  minRaw: number | null,
  maxRaw: number | null,
  opts: { visible: boolean; salaryType: string | null },
): { salaryMin: number | null; salaryMax: number | null; salaryLabel: string } {
  if (!opts.visible || opts.salaryType === "Not specified") {
    return { salaryMin: null, salaryMax: null, salaryLabel: "Salary not disclosed" };
  }
  if (opts.salaryType === "Negotiable") {
    return { salaryMin: null, salaryMax: null, salaryLabel: "Negotiable" };
  }

  const salaryMin = toLpa(minRaw);
  const salaryMax = toLpa(maxRaw);

  if (salaryMin != null && salaryMax != null) {
    return {
      salaryMin,
      salaryMax,
      salaryLabel:
        salaryMin === salaryMax
          ? `₹${salaryMin} LPA`
          : `₹${salaryMin}–${salaryMax} LPA`,
    };
  }
  if (salaryMin != null) {
    return { salaryMin, salaryMax: salaryMin, salaryLabel: `₹${salaryMin} LPA` };
  }
  if (salaryMax != null) {
    return { salaryMin: salaryMax, salaryMax, salaryLabel: `₹${salaryMax} LPA` };
  }
  return { salaryMin: null, salaryMax: null, salaryLabel: "Salary not disclosed" };
}

function mapWorkMode(value: string): WorkMode {
  const normalized = value.toLowerCase();
  if (normalized === "remote") return "Remote";
  if (normalized === "on-site" || normalized === "onsite") return "On-site";
  return "Hybrid";
}

function mapEmploymentType(
  employmentType: string,
  jobType: string,
): EmploymentType {
  const jt = jobType.toLowerCase();
  if (jt.includes("freelance")) return "Freelance";
  if (jt.includes("intern")) return "Internship";
  if (jt.includes("contract")) return "Contract";
  if (employmentType.toLowerCase().includes("part")) return "Part-time";
  return "Full-time";
}

function mapStatus(status: string): JobStatus {
  if (status === "active") return "active";
  if (status === "paused" || status === "draft") return "paused";
  return "closed";
}

function companyLocation(company: DiscoveryCompanyJoin | null): string {
  if (!company) return "";
  return [company.city, company.state, company.country].filter(Boolean).join(", ");
}

function logoInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "C";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function logoColor(seed: string): string {
  const colors = ["#2563EB", "#0D9488", "#7C3AED", "#059669", "#EA580C", "#DC2626"];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash + seed.charCodeAt(i) * 17) % colors.length;
  return colors[Math.abs(hash) % colors.length];
}

export function mapJobRowToDiscovery(row: DiscoveryJobRow): DiscoveryJob {
  const company = asCompany(row.company_profiles);
  const companyName = company?.company_name?.trim() || "Company";
  const salary = formatSalaryLabel(toNumber(row.salary_min), toNumber(row.salary_max), {
    visible: row.salary_visible,
    salaryType: row.salary_type,
  });
  const experienceMax = row.maximum_experience;
  const experienceLabel =
    experienceMax != null
      ? `${row.minimum_experience}–${experienceMax} years`
      : `${row.minimum_experience}+ years`;

  return {
    id: row.id,
    title: row.title,
    companyId: row.company_id,
    companyName,
    companyLogo: logoInitials(companyName),
    companyLogoColor: logoColor(row.company_id || companyName),
    companyLogoUrl: company?.logo_url ?? null,
    location: row.location,
    locations: [row.location.split(",")[0]?.trim() || row.location],
    workMode: mapWorkMode(row.work_arrangement),
    employmentType: mapEmploymentType(row.employment_type, row.job_type),
    experienceMin: row.minimum_experience,
    experienceMax,
    experienceLabel,
    salaryMin: salary.salaryMin,
    salaryMax: salary.salaryMax,
    salaryCurrency: "INR",
    salaryLabel: salary.salaryLabel,
    description: row.description,
    responsibilities: splitList(row.responsibilities),
    requiredSkills: splitList(row.required_skills),
    preferredSkills: splitList(row.preferred_skills),
    sapModules: [row.sap_module, row.sap_specialization ?? ""]
      .map((s) => s.trim())
      .filter(Boolean),
    benefits: parseBenefits(row.benefits),
    postedAt: row.published_at ?? row.created_at,
    department: row.industry || company?.industry || "SAP",
    status: mapStatus(row.status),
    expiresAt: row.application_deadline,
    industry: company?.industry || row.industry || "",
    companySize: company?.company_size || "",
    companyDescription: company?.about || "",
    companyLocation: companyLocation(company) || row.location,
  };
}

/** Convert UI LPA bounds to absolute INR for DB filtering (employer stores absolute amounts). */
export function lpaToAbsolute(lpa: number): number {
  return Math.round(lpa * 100_000);
}
