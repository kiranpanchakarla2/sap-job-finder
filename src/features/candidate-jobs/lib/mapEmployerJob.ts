/**
 * Adapter: EmployerJobRecord → DiscoveryJob for Phase B.
 * Phase A mock data already matches DiscoveryJob; this keeps UI compatible
 * with employer-created jobs without a second job database.
 */

import type { EmployerJobRecord } from "@/features/employer-jobs/types/job.types";
import type {
  DiscoveryJob,
  EmploymentType,
  WorkMode,
} from "../types/job.types";

function mapWorkMode(value: EmployerJobRecord["workArrangement"]): WorkMode {
  if (value === "On-site") return "On-site";
  if (value === "Remote") return "Remote";
  return "Hybrid";
}

function mapEmploymentType(job: EmployerJobRecord): EmploymentType {
  if (job.jobType === "Contract" || job.jobType === "Contract-to-Hire") {
    return "Contract";
  }
  if (job.jobType === "Freelance") return "Freelance";
  if (job.employmentType === "Part-time") return "Part-time";
  return "Full-time";
}

function splitSkills(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatSalaryLpa(job: EmployerJobRecord): {
  salaryMin: number | null;
  salaryMax: number | null;
  salaryLabel: string;
} {
  if (job.salaryVisibility === "hide" || job.salaryType === "Not specified") {
    return { salaryMin: null, salaryMax: null, salaryLabel: "Not disclosed" };
  }
  if (job.salaryType === "Negotiable") {
    return { salaryMin: null, salaryMax: null, salaryLabel: "Negotiable" };
  }

  // Employer salaries may be annual absolute; treat large INR values as ÷100000 → LPA
  const toLpa = (n: number | null) => {
    if (n == null) return null;
    return n >= 1000 ? Math.round(n / 100000) : n;
  };

  const salaryMin = toLpa(job.minSalary);
  const salaryMax = toLpa(job.maxSalary);

  if (salaryMin != null && salaryMax != null) {
    return {
      salaryMin,
      salaryMax,
      salaryLabel: `₹${salaryMin}–${salaryMax} LPA`,
    };
  }
  if (salaryMin != null) {
    return { salaryMin, salaryMax: salaryMin, salaryLabel: `₹${salaryMin} LPA` };
  }
  return { salaryMin: null, salaryMax: null, salaryLabel: "Not disclosed" };
}

function mapStatus(status: EmployerJobRecord["status"]): DiscoveryJob["status"] {
  if (status === "Active") return "active";
  if (status === "Paused" || status === "Draft") return "paused";
  return "closed";
}

/**
 * Maps an employer job record into the candidate discovery model.
 * Use this when Phase B loads from the shared `jobs` table.
 */
export function mapEmployerJobToDiscovery(
  job: EmployerJobRecord,
  companyMeta?: {
    logo?: string;
    logoColor?: string;
    description?: string;
    industry?: string;
    companySize?: string;
    location?: string;
  },
): DiscoveryJob {
  const salary = formatSalaryLpa(job);
  const experienceMax = job.maxExperience;
  const experienceLabel =
    experienceMax != null
      ? `${job.minExperience}–${experienceMax} years`
      : `${job.minExperience}+ years`;

  return {
    id: job.id,
    title: job.title,
    companyId: job.company.toLowerCase().replace(/\s+/g, "-"),
    companyName: job.company,
    companyLogo: companyMeta?.logo ?? job.logoUrl?.slice(0, 1)?.toUpperCase() ?? "C",
    companyLogoColor: companyMeta?.logoColor ?? "#7C3AED",
    location: job.location,
    locations: [job.location.split(",")[0]?.trim() || job.location],
    workMode: mapWorkMode(job.workArrangement),
    employmentType: mapEmploymentType(job),
    experienceMin: job.minExperience,
    experienceMax,
    experienceLabel,
    salaryMin: salary.salaryMin,
    salaryMax: salary.salaryMax,
    salaryCurrency: "INR",
    salaryLabel: salary.salaryLabel,
    description: job.description,
    responsibilities: job.responsibilities
      .split(/\n|•/)
      .map((line) => line.trim())
      .filter(Boolean),
    requiredSkills: splitSkills(job.requiredSkills),
    preferredSkills: splitSkills(job.preferredSkills),
    sapModules: [job.sapModule, job.sapSpecialization].filter(Boolean),
    benefits: job.benefits,
    postedAt: job.postedAt ?? job.createdAt,
    department: job.industry || "SAP",
    status: mapStatus(job.status),
    expiresAt: job.deadline,
    industry: companyMeta?.industry ?? job.industry,
    companySize: companyMeta?.companySize ?? "",
    companyDescription: companyMeta?.description ?? "",
    companyLocation: companyMeta?.location ?? job.location,
  };
}
