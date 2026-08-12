/**
 * Public marketplace fixtures.
 * Catalog source of truth for Sprint 3 Phase A lives in features/candidate-jobs.
 * This module maps DiscoveryJob → MockJob for homepage / legacy consumers.
 */

import {
  MOCK_DISCOVERY_COMPANIES,
  getDiscoveryCompanyById,
} from "@/features/candidate-jobs/data/mockCompanies";
import {
  MOCK_DISCOVERY_JOBS,
  getDiscoveryJobById as getDiscoveryJob,
  listActiveDiscoveryJobs,
} from "@/features/candidate-jobs/data/mockJobs";
import type { DiscoveryJob } from "@/features/candidate-jobs/types/job.types";
import { formatPostedShort } from "@/features/candidate-jobs/lib/formatPosted";

export type MockJob = {
  id: string;
  title: string;
  company: string;
  companyId: string;
  logo: string;
  location: string;
  salary: string;
  experience: string;
  employmentType: "FULL-TIME" | "PART-TIME" | "INTERNSHIP" | "CONTRACT";
  workMode: "Remote" | "Hybrid" | "Onsite";
  module: string;
  skills: string[];
  description: string;
  requirements: string[];
  benefits: string[];
  featured?: boolean;
  highlight?: boolean;
  postedAt: string;
};

export type MockCompany = {
  id: string;
  name: string;
  logo: string;
  logoColor: string;
  description: string;
  website: string;
  location: string;
  openRoles: number;
  featured?: boolean;
};

function moduleSlug(job: DiscoveryJob): string {
  const primary = job.sapModules[0] ?? "";
  return primary
    .toLowerCase()
    .replace(/^sap\s+/i, "")
    .replace(/[^a-z0-9]+/g, "")
    .replace(/hana$/, "s4hana") || "general";
}

function mapEmployment(
  value: DiscoveryJob["employmentType"],
): MockJob["employmentType"] {
  switch (value) {
    case "Part-time":
      return "PART-TIME";
    case "Internship":
      return "INTERNSHIP";
    case "Contract":
    case "Freelance":
      return "CONTRACT";
    default:
      return "FULL-TIME";
  }
}

export function discoveryJobToMockJob(job: DiscoveryJob): MockJob {
  return {
    id: job.id,
    title: job.title,
    company: job.companyName,
    companyId: job.companyId,
    logo: job.companyLogo,
    location: job.location,
    salary: job.salaryLabel,
    experience: job.experienceLabel,
    employmentType: mapEmployment(job.employmentType),
    workMode: job.workMode === "On-site" ? "Onsite" : job.workMode,
    module: moduleSlug(job),
    skills: job.requiredSkills,
    description: job.description,
    requirements: job.responsibilities,
    benefits: job.benefits,
    featured: job.featured,
    highlight: job.featured,
    postedAt: formatPostedShort(job.postedAt),
  };
}

export const mockCompanies: MockCompany[] = MOCK_DISCOVERY_COMPANIES.map((c) => ({
  id: c.id,
  name: c.name,
  logo: c.logo,
  logoColor: c.logoColor,
  description: c.description,
  website: c.website ?? "#",
  location: c.location,
  openRoles: MOCK_DISCOVERY_JOBS.filter((j) => j.companyId === c.id && j.status === "active")
    .length,
  featured: ["infosys", "tcs", "accenture", "capgemini"].includes(c.id),
}));

export const mockJobs: MockJob[] = listActiveDiscoveryJobs().map(discoveryJobToMockJob);

export function getJobById(id: string) {
  const job = getDiscoveryJob(id);
  return job ? discoveryJobToMockJob(job) : undefined;
}

export function getCompanyById(id: string) {
  return mockCompanies.find((c) => c.id === id) ?? (() => {
    const c = getDiscoveryCompanyById(id);
    if (!c) return undefined;
    return {
      id: c.id,
      name: c.name,
      logo: c.logo,
      logoColor: c.logoColor,
      description: c.description,
      website: c.website ?? "#",
      location: c.location,
      openRoles: 0,
    } satisfies MockCompany;
  })();
}

export function filterJobs(params: {
  q?: string;
  location?: string;
  module?: string;
  workMode?: string;
}) {
  const q = params.q?.toLowerCase().trim();
  const location = params.location?.toLowerCase().trim();
  const module = params.module?.toLowerCase().trim();
  const workMode = params.workMode?.toLowerCase().trim();

  return mockJobs.filter((job) => {
    if (q) {
      const hay = `${job.title} ${job.company} ${job.skills.join(" ")} ${job.module}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (location && !job.location.toLowerCase().includes(location)) return false;
    if (module && job.module !== module) return false;
    if (workMode && job.workMode.toLowerCase() !== workMode) return false;
    return true;
  });
}
