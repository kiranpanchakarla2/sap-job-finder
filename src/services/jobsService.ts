import { createClient } from "@/lib/supabase/client";
import { filterJobs, getJobById, mockJobs, type MockJob } from "@/lib/mock-data";

export type JobFilters = {
  q?: string;
  location?: string;
  module?: string;
  workMode?: string;
};

/**
 * Lists active jobs from Supabase when available; falls back to mock data.
 */
export async function listJobs(filters: JobFilters = {}): Promise<MockJob[]> {
  try {
    const supabase = createClient();
    let query = supabase
      .from("jobs")
      .select(
        "id, title, location, salary_min, salary_max, minimum_experience, maximum_experience, work_arrangement, sap_module, description, status, created_at, published_at, company_id",
      )
      .eq("status", "active")
      .order("published_at", { ascending: false, nullsFirst: false });

    if (filters.module) query = query.eq("sap_module", filters.module);
    if (filters.workMode) query = query.ilike("work_arrangement", filters.workMode);
    if (filters.location) query = query.ilike("location", `%${filters.location}%`);
    if (filters.q) {
      query = query.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`);
    }

    const { data, error } = await query;
    if (error || !data?.length) {
      return filterJobs(filters);
    }

    const companyIds = [...new Set(data.map((row) => row.company_id).filter(Boolean))];
    const { data: companies } = await supabase
      .from("company_profiles")
      .select("id, company_name, logo_url")
      .in("id", companyIds);

    const companyMap = new Map(
      (companies ?? []).map((company) => [company.id, company] as const),
    );

    return data.map((row) => mapRowToJob(row, companyMap.get(row.company_id) ?? null));
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
        "id, title, location, salary_min, salary_max, minimum_experience, maximum_experience, work_arrangement, sap_module, description, status, created_at, published_at, company_id",
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return getJobById(id) ?? null;
    }

    const { data: company } = await supabase
      .from("company_profiles")
      .select("id, company_name, logo_url")
      .eq("id", data.company_id)
      .maybeSingle();

    return mapRowToJob(data, company);
  } catch {
    return getJobById(id) ?? null;
  }
}

export async function listFeaturedJobs(): Promise<MockJob[]> {
  const jobs = await listJobs();
  const featured = jobs.filter((j) => j.featured);
  return featured.length ? featured : mockJobs.filter((j) => j.featured);
}

function mapRowToJob(
  row: {
    id: string;
    title: string;
    location: string | null;
    salary_min: number | null;
    salary_max: number | null;
    minimum_experience: number | null;
    maximum_experience: number | null;
    work_arrangement: string | null;
    sap_module: string | null;
    description: string | null;
    created_at: string;
    company_id: string;
  },
  company: { id: string; company_name: string; logo_url: string | null } | null,
): MockJob {
  const salaryMin = row.salary_min;
  const salaryMax = row.salary_max;
  const expMin = row.minimum_experience;
  const expMax = row.maximum_experience;
  const work =
    row.work_arrangement === "Remote" ||
    row.work_arrangement === "Hybrid" ||
    row.work_arrangement === "On-site" ||
    row.work_arrangement === "Onsite"
      ? row.work_arrangement === "On-site"
        ? "Onsite"
        : row.work_arrangement
      : "Hybrid";

  return {
    id: row.id,
    title: row.title,
    company: company?.company_name ?? "Company",
    companyId: company?.id ?? row.company_id,
    logo: (company?.company_name ?? "C").slice(0, 1).toUpperCase(),
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
    workMode: work as MockJob["workMode"],
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
