import { createClient } from "@/lib/supabase/client";
import { filterJobs, getJobById, mockJobs, type MockJob } from "@/lib/mock-data";

export type JobFilters = {
  q?: string;
  location?: string;
  module?: string;
  workMode?: string;
};

/**
 * Lists jobs from Supabase when configured; falls back to mock data for local UI.
 */
export async function listJobs(filters: JobFilters = {}): Promise<MockJob[]> {
  try {
    const supabase = createClient();
    let query = supabase
      .from("jobs")
      .select(
        "id, title, location, salary_min, salary_max, experience_years, work_mode, module, skills, description, requirements, benefits, featured, created_at, companies(id, name, logo)",
      )
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (filters.module) query = query.eq("module", filters.module);
    if (filters.workMode) query = query.ilike("work_mode", filters.workMode);
    if (filters.location) query = query.ilike("location", `%${filters.location}%`);
    if (filters.q) {
      query = query.or(
        `title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`,
      );
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
        "id, title, location, salary_min, salary_max, experience_years, work_mode, module, skills, description, requirements, benefits, featured, created_at, companies(id, name, logo)",
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
  const company = Array.isArray(row.companies) ? row.companies[0] : row.companies;
  const salaryMin = row.salary_min;
  const salaryMax = row.salary_max;
  return {
    id: row.id,
    title: row.title,
    company: company?.name ?? "Company",
    companyId: company?.id ?? "",
    logo: company?.logo ?? (company?.name?.[0] ?? "C"),
    location: row.location ?? "",
    salary:
      salaryMin && salaryMax
        ? `₹${salaryMin}–${salaryMax} LPA`
        : "Competitive",
    experience: row.experience_years ? `${row.experience_years} Years` : "—",
    employmentType: "FULL-TIME",
    workMode: (row.work_mode as MockJob["workMode"]) ?? "Hybrid",
    module: row.module ?? "",
    skills: row.skills ?? [],
    description: row.description ?? "",
    requirements: row.requirements ?? [],
    benefits: row.benefits ?? [],
    featured: Boolean(row.featured),
    postedAt: row.created_at
      ? new Date(row.created_at).toLocaleDateString()
      : "Recently",
  };
}
