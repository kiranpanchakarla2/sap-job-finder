import { createClient } from "@/lib/supabase/client";
import { filterJobs, getJobById, mockJobs, type MockJob } from "@/lib/mock-data";

export type JobFilters = {
  q?: string;
  location?: string;
  module?: string;
  workMode?: string;
};

/**
 * Lists published jobs from Supabase when available; falls back to mock data.
 */
export async function listJobs(filters: JobFilters = {}): Promise<MockJob[]> {
  try {
    const supabase = createClient();
    let query = supabase
      .from("jobs")
      .select(
        "id, title, location, salary_min, salary_max, experience_min, experience_max, remote_type, sap_module, description, status, created_at, employer_profiles(id, company_name, company_logo_url)",
      )
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (filters.module) query = query.eq("sap_module", filters.module);
    if (filters.workMode) query = query.ilike("remote_type", filters.workMode);
    if (filters.location) query = query.ilike("location", `%${filters.location}%`);
    if (filters.q) {
      query = query.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`);
    }

    const { data, error } = await query;
    if (error || !data?.length) {
      return filterJobs(filters);
    }

    return data.map(mapRowToJob);
  } catch {
    return filterJobs(filters);
  }
}

export async function getJob(id: string): Promise<MockJob | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("jobs")
      .select(
        "id, title, location, salary_min, salary_max, experience_min, experience_max, remote_type, sap_module, description, status, created_at, employer_profiles(id, company_name, company_logo_url)",
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return getJobById(id) ?? null;
    }

    return mapRowToJob(data);
  } catch {
    return getJobById(id) ?? null;
  }
}

export async function listFeaturedJobs(): Promise<MockJob[]> {
  const jobs = await listJobs();
  const featured = jobs.filter((j) => j.featured);
  return featured.length ? featured : mockJobs.filter((j) => j.featured);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToJob(row: any): MockJob {
  const employer = Array.isArray(row.employer_profiles)
    ? row.employer_profiles[0]
    : row.employer_profiles;
  const salaryMin = row.salary_min;
  const salaryMax = row.salary_max;
  const expMin = row.experience_min;
  const expMax = row.experience_max;

  return {
    id: row.id,
    title: row.title,
    company: employer?.company_name ?? "Company",
    companyId: employer?.id ?? "company",
    logo: (employer?.company_name ?? "C").slice(0, 1).toUpperCase(),
    location: row.location ?? "Remote",
    salary:
      salaryMin != null && salaryMax != null
        ? `₹${salaryMin}–${salaryMax} LPA`
        : "Competitive",
    experience:
      expMin != null && expMax != null
        ? `${expMin}-${expMax} years`
        : expMin != null
          ? `${expMin}+ years`
          : "Not specified",
    employmentType: "FULL-TIME",
    workMode:
      row.remote_type === "Remote" || row.remote_type === "Hybrid" || row.remote_type === "Onsite"
        ? row.remote_type
        : "Hybrid",
    module: row.sap_module ?? "SAP",
    skills: [],
    description: row.description ?? "",
    requirements: [],
    benefits: [],
    featured: false,
    postedAt: row.created_at
      ? new Date(row.created_at).toLocaleDateString()
      : "Recently",
  };
}
