import { createClient } from "@/lib/supabase/client";
import type {
  CandidateMatchProfile,
  DiscoveryJob,
  ExperienceFilterOption,
  JobSearchState,
  SalaryFilterOption,
} from "../types/job.types";
import {
  JOB_CARD_SELECT,
  JOB_DETAIL_SELECT,
  lpaToAbsolute,
  mapJobRowToDiscovery,
  type DiscoveryJobRow,
} from "../lib/mapJobRow";
import { scoreJobMatch } from "../lib/matchJobs";

export type CandidateJobServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type JobSearchPageResult = {
  jobs: DiscoveryJob[];
  total: number;
  hasMore: boolean;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: unknown }).message ?? "").trim();
    if (message && process.env.NODE_ENV === "development") {
      console.error("[candidateJobService]", message, error);
    }
  }
  return fallback;
}

/** Escape characters that break PostgREST `or` / `ilike` filter strings. */
function sanitizeFilterValue(value: string): string {
  return value.replace(/[%_,.()]/g, " ").replace(/\s+/g, " ").trim();
}

function experienceBucket(option: ExperienceFilterOption): { min: number; max: number } {
  switch (option) {
    case "Entry Level":
      return { min: 0, max: 1 };
    case "1–3 Years":
      return { min: 1, max: 3 };
    case "3–5 Years":
      return { min: 3, max: 5 };
    case "5–8 Years":
      return { min: 5, max: 8 };
    case "8–12 Years":
      return { min: 8, max: 12 };
    case "12+ Years":
      return { min: 12, max: 99 };
  }
}

function salaryBucket(option: SalaryFilterOption): { min: number; max: number } {
  switch (option) {
    case "Under ₹5 LPA":
      return { min: 0, max: 5 };
    case "₹5–10 LPA":
      return { min: 5, max: 10 };
    case "₹10–15 LPA":
      return { min: 10, max: 15 };
    case "₹15–25 LPA":
      return { min: 15, max: 25 };
    case "₹25–40 LPA":
      return { min: 25, max: 40 };
    case "₹40+ LPA":
      return { min: 40, max: 500 };
  }
}

function postedCutoff(filter: JobSearchState["postedDate"], now = new Date()): string | null {
  if (filter === "any") return null;
  const day = 24 * 60 * 60 * 1000;
  const ms: Record<Exclude<JobSearchState["postedDate"], "any">, number> = {
    "24h": day,
    "3d": 3 * day,
    "7d": 7 * day,
    "14d": 14 * day,
    "30d": 30 * day,
  };
  return new Date(now.getTime() - ms[filter]).toISOString();
}

function mapEmploymentFilters(jobTypes: JobSearchState["jobTypes"]): {
  employmentTypes: string[];
  jobTypes: string[];
} {
  const employmentTypes: string[] = [];
  const dbJobTypes: string[] = [];
  for (const type of jobTypes) {
    if (type === "Full-time") employmentTypes.push("Full-time");
    else if (type === "Part-time") employmentTypes.push("Part-time");
    else if (type === "Contract") {
      dbJobTypes.push("Contract", "Contract-to-Hire");
    } else if (type === "Freelance") dbJobTypes.push("Freelance");
    else if (type === "Internship") dbJobTypes.push("Internship");
  }
  return { employmentTypes, jobTypes: dbJobTypes };
}

type AnyQuery = {
  or: (filters: string) => AnyQuery;
  ilike: (column: string, pattern: string) => AnyQuery;
  in: (column: string, values: string[]) => AnyQuery;
  eq: (column: string, value: string | boolean) => AnyQuery;
};

function applySearchFilters(query: AnyQuery, filters: JobSearchState): AnyQuery {
  const keyword = sanitizeFilterValue(filters.keyword);
  if (keyword) {
    const pattern = `"%${keyword}%"`;
    query = query.or(
      [
        `title.ilike.${pattern}`,
        `description.ilike.${pattern}`,
        `required_skills.ilike.${pattern}`,
        `preferred_skills.ilike.${pattern}`,
        `sap_module.ilike.${pattern}`,
        `sap_specialization.ilike.${pattern}`,
        `location.ilike.${pattern}`,
      ].join(","),
    );
  }

  const locationText = sanitizeFilterValue(filters.location);
  if (locationText) {
    query = query.ilike("location", `%${locationText}%`);
  }

  if (filters.locations.length) {
    const locationOr = filters.locations
      .map((loc) => {
        if (loc === "Other") return null;
        const safe = sanitizeFilterValue(loc);
        if (!safe) return null;
        if (safe.toLowerCase() === "bengaluru") {
          return `location.ilike."%Bengaluru%",location.ilike."%Bangalore%"`;
        }
        return `location.ilike."%${safe}%"`;
      })
      .filter(Boolean)
      .join(",");
    if (locationOr) query = query.or(locationOr);
  }

  if (filters.experience.length) {
    const experienceOr = filters.experience
      .map((option) => {
        const range = experienceBucket(option);
        return `and(minimum_experience.lte.${range.max},or(maximum_experience.gte.${range.min},maximum_experience.is.null))`;
      })
      .join(",");
    query = query.or(experienceOr);
  }

  if (filters.sapModules.length) {
    const moduleOr = filters.sapModules
      .map((module) => {
        const safe = sanitizeFilterValue(module);
        return safe
          ? `sap_module.ilike."%${safe}%",sap_specialization.ilike."%${safe}%"`
          : null;
      })
      .filter(Boolean)
      .join(",");
    if (moduleOr) query = query.or(moduleOr);
  }

  if (filters.workModes.length) {
    query = query.in("work_arrangement", filters.workModes);
  }

  const employment = mapEmploymentFilters(filters.jobTypes);
  if (employment.employmentTypes.length && employment.jobTypes.length) {
    query = query.or(
      [
        ...employment.employmentTypes.map((t) => `employment_type.eq.${t}`),
        ...employment.jobTypes.map((t) => `job_type.eq.${t}`),
      ].join(","),
    );
  } else if (employment.employmentTypes.length) {
    query = query.in("employment_type", employment.employmentTypes);
  } else if (employment.jobTypes.length) {
    query = query.in("job_type", employment.jobTypes);
  }

  if (filters.salaryMinCustom != null || filters.salaryMaxCustom != null) {
    const min = filters.salaryMinCustom ?? 0;
    const max = filters.salaryMaxCustom ?? 500;
    query = query.eq("salary_visible", true);
    const absMin = lpaToAbsolute(min);
    const absMax = lpaToAbsolute(max);
    query = query.or(
      [
        `and(salary_min.lte.${max},or(salary_max.gte.${min},salary_max.is.null))`,
        `and(salary_min.lte.${absMax},or(salary_max.gte.${absMin},salary_max.is.null))`,
      ].join(","),
    );
  } else if (filters.salaryRanges.length) {
    query = query.eq("salary_visible", true);
    const salaryOr = filters.salaryRanges
      .map((option) => {
        const range = salaryBucket(option);
        const absMin = lpaToAbsolute(range.min);
        const absMax = lpaToAbsolute(range.max);
        return [
          `and(salary_min.lte.${range.max},or(salary_max.gte.${range.min},salary_max.is.null))`,
          `and(salary_min.lte.${absMax},or(salary_max.gte.${absMin},salary_max.is.null))`,
        ].join(",");
      })
      .join(",");
    query = query.or(salaryOr);
  }

  const cutoff = postedCutoff(filters.postedDate);
  if (cutoff) {
    query = query.or(
      `published_at.gte.${cutoff},and(published_at.is.null,created_at.gte.${cutoff})`,
    );
  }

  return query;
}

function applySort<T extends { order: (column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) => T }>(
  query: T,
  sort: JobSearchState["sort"],
): T {
  switch (sort) {
    case "salary_high":
      return query
        .order("salary_max", { ascending: false, nullsFirst: false })
        .order("published_at", { ascending: false, nullsFirst: false });
    case "salary_low":
      return query
        .order("salary_min", { ascending: true, nullsFirst: false })
        .order("published_at", { ascending: false, nullsFirst: false });
    case "recent":
      return query
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
    case "relevance":
    default:
      // Deterministic relevance: most recently published first (no Postgres FTS rank yet).
      return query
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
  }
}

async function fetchActiveJobsPage(
  filters: JobSearchState,
  offset: number,
  limit: number,
): Promise<CandidateJobServiceResult<JobSearchPageResult>> {
  try {
    const supabase = createClient();
    let query = supabase
      .from("jobs")
      .select(JOB_CARD_SELECT, { count: "exact" })
      .eq("status", "active");

    query = applySearchFilters(query as unknown as AnyQuery, filters) as typeof query;
    query = applySort(query, filters.sort);
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "We couldn't load jobs right now."),
      };
    }

    const jobs = ((data ?? []) as unknown as DiscoveryJobRow[]).map(mapJobRowToDiscovery);
    const total = count ?? jobs.length;

    return {
      success: true,
      data: {
        jobs,
        total,
        hasMore: offset + jobs.length < total,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "We couldn't load jobs right now."),
    };
  }
}

export const candidateJobService = {
  async searchJobs(
    filters: JobSearchState,
    options?: { offset?: number; limit?: number },
  ): Promise<CandidateJobServiceResult<JobSearchPageResult>> {
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 10;
    return fetchActiveJobsPage(filters, offset, limit);
  },

  async getJobById(jobId: string): Promise<CandidateJobServiceResult<DiscoveryJob | null>> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("jobs")
        .select(JOB_DETAIL_SELECT)
        .eq("id", jobId)
        .maybeSingle();

      if (error) {
        return {
          success: false,
          error: getErrorMessage(error, "We couldn't load this job."),
        };
      }

      if (!data) {
        return { success: true, data: null };
      }

      return {
        success: true,
        data: mapJobRowToDiscovery(data as unknown as DiscoveryJobRow),
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "We couldn't load this job."),
      };
    }
  },

  async getCompanyJobs(
    companyId: string,
    excludeJobId: string,
    limit = 3,
  ): Promise<CandidateJobServiceResult<DiscoveryJob[]>> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("jobs")
        .select(JOB_CARD_SELECT)
        .eq("status", "active")
        .eq("company_id", companyId)
        .neq("id", excludeJobId)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(limit);

      if (error) {
        return {
          success: false,
          error: getErrorMessage(error, "Unable to load company jobs."),
        };
      }

      return {
        success: true,
        data: ((data ?? []) as unknown as DiscoveryJobRow[]).map(mapJobRowToDiscovery),
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Unable to load company jobs."),
      };
    }
  },

  async getRelatedJobs(
    job: DiscoveryJob,
    limit = 4,
  ): Promise<CandidateJobServiceResult<DiscoveryJob[]>> {
    try {
      const supabase = createClient();
      const module = job.sapModules[0];
      const city = job.location.split(",")[0]?.trim() ?? job.location;

      let query = supabase
        .from("jobs")
        .select(JOB_CARD_SELECT)
        .eq("status", "active")
        .neq("id", job.id)
        .limit(24);

      if (module || city) {
        const parts: string[] = [];
        if (module) {
          const safe = sanitizeFilterValue(module);
          if (safe) parts.push(`sap_module.ilike."%${safe}%"`);
        }
        if (city) {
          const safe = sanitizeFilterValue(city);
          if (safe) parts.push(`location.ilike."%${safe}%"`);
        }
        if (parts.length) query = query.or(parts.join(","));
      }

      const { data, error } = await query;
      if (error) {
        return {
          success: false,
          error: getErrorMessage(error, "Unable to load related jobs."),
        };
      }

      const mapped = ((data ?? []) as unknown as DiscoveryJobRow[]).map(mapJobRowToDiscovery);
      const scored = mapped
        .map((candidate) => {
          let score = 0;
          if (
            candidate.sapModules.some((m) =>
              job.sapModules.some((jm) => jm.toLowerCase() === m.toLowerCase()),
            )
          ) {
            score += 2;
          }
          if (
            candidate.location.split(",")[0]?.trim().toLowerCase() ===
            job.location.split(",")[0]?.trim().toLowerCase()
          ) {
            score += 1;
          }
          if (candidate.workMode === job.workMode) score += 1;
          const tokens = job.title.toLowerCase().split(/\s+/);
          if (tokens.some((t) => t.length > 3 && candidate.title.toLowerCase().includes(t))) {
            score += 1;
          }
          return { candidate, score };
        })
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((entry) => entry.candidate);

      return { success: true, data: scored };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Unable to load related jobs."),
      };
    }
  },

  async getRecommendedJobs(
    profile: CandidateMatchProfile,
    limit = 4,
  ): Promise<CandidateJobServiceResult<Array<DiscoveryJob & { matchScore: number }>>> {
    try {
      const supabase = createClient();
      let query = supabase
        .from("jobs")
        .select(JOB_CARD_SELECT)
        .eq("status", "active")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(40);

      if (profile.sapModules.length) {
        const moduleOr = profile.sapModules
          .slice(0, 6)
          .map((module) => {
            const safe = sanitizeFilterValue(module);
            return safe ? `sap_module.ilike."%${safe}%"` : null;
          })
          .filter(Boolean)
          .join(",");
        if (moduleOr) query = query.or(moduleOr);
      }

      const { data, error } = await query;
      if (error) {
        return {
          success: false,
          error: getErrorMessage(error, "Unable to load recommendations."),
        };
      }

      const mapped = ((data ?? []) as unknown as DiscoveryJobRow[]).map(mapJobRowToDiscovery);
      const ranked = mapped
        .map((job) => {
          const match = scoreJobMatch(job, profile);
          return { ...job, matchScore: match.score, matchTier: match.tier };
        })
        .filter((job) => job.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);

      // If profile is sparse, fall back to latest active jobs without scores
      if (!ranked.length) {
        const latest = mapped.slice(0, limit).map((job) => ({
          ...job,
          matchScore: 0,
        }));
        return { success: true, data: latest };
      }

      return { success: true, data: ranked };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Unable to load recommendations."),
      };
    }
  },
};

