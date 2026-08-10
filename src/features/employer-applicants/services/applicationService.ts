import { createClient } from "@/lib/supabase/client";
import {
  filterAndSortApplications,
  computeApplicationStats,
} from "../lib/filterApplications";
import {
  APPLICATION_SELECT,
  mapApplicationRow,
  type ApplicationJoinRow,
} from "../lib/mappers";
import type {
  ApplicationQuery,
  ApplicationServiceResult,
  ApplicationStatus,
  ApplicationSummaryStats,
  EmployerApplication,
  JobFilterOption,
} from "../types/application.types";

const ERR = {
  auth: "Please sign in again to continue.",
  company: "Complete your company profile before reviewing applicants.",
  load: "Unable to load applicants.",
  loadOne: "Unable to load this application.",
  updateStatus: "Unable to update application status.",
  updateNotes: "Unable to update employer notes.",
  resume: "Unable to load resume.",
  download: "Unable to download resume.",
  notFound: "Application not found.",
} as const;

const RESUME_BUCKET = "candidate-resumes";
const SIGNED_URL_TTL_SECONDS = 60 * 10;

function logError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[applicationService] ${context}`, error);
  }
}

async function requireEmployerContext(): Promise<
  ApplicationServiceResult<{ userId: string; companyId: string }>
> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logError("auth", authError);
    return { success: false, error: ERR.auth };
  }

  const { data: company, error: companyError } = await supabase
    .from("company_profiles")
    .select("id, setup_complete")
    .eq("user_id", user.id)
    .maybeSingle();

  if (companyError) {
    logError("company", companyError);
    return { success: false, error: ERR.company };
  }

  if (!company?.id || !company.setup_complete) {
    return { success: false, error: ERR.company };
  }

  return { success: true, data: { userId: user.id, companyId: company.id } };
}

function normalizeJoinedRow(row: Record<string, unknown>): ApplicationJoinRow {
  const jobs = Array.isArray(row.jobs) ? row.jobs[0] : row.jobs;
  const candidate = Array.isArray(row.candidate_profiles)
    ? row.candidate_profiles[0]
    : row.candidate_profiles;

  return {
    ...(row as unknown as ApplicationJoinRow),
    jobs: (jobs as ApplicationJoinRow["jobs"]) ?? null,
    candidate_profiles:
      (candidate as ApplicationJoinRow["candidate_profiles"]) ?? null,
  };
}

async function fetchEmployerApplications(): Promise<
  ApplicationServiceResult<EmployerApplication[]>
> {
  const ctx = await requireEmployerContext();
  if (!ctx.success) return ctx;

  const supabase = createClient();

  // RLS enforces company ownership via owns_job; also scope by company jobs.
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("id")
    .eq("company_id", ctx.data.companyId);

  if (jobsError) {
    logError("jobs", jobsError);
    return { success: false, error: ERR.load };
  }

  const jobIds = (jobs ?? []).map((job) => job.id);
  if (jobIds.length === 0) {
    return { success: true, data: [] };
  }

  const { data, error } = await supabase
    .from("job_applications")
    .select(APPLICATION_SELECT)
    .in("job_id", jobIds)
    .order("applied_at", { ascending: false });

  if (error) {
    logError("list", error);
    return { success: false, error: ERR.load };
  }

  const applications = ((data ?? []) as unknown as Record<string, unknown>[]).map(
    (row) => mapApplicationRow(normalizeJoinedRow(row)),
  );

  return { success: true, data: applications };
}

export const applicationService = {
  async listApplications(
    query: ApplicationQuery = {},
  ): Promise<ApplicationServiceResult<EmployerApplication[]>> {
    const result = await fetchEmployerApplications();
    if (!result.success) return result;
    return {
      success: true,
      data: filterAndSortApplications(result.data, query),
    };
  },

  async getApplication(
    id: string,
  ): Promise<ApplicationServiceResult<EmployerApplication | null>> {
    const ctx = await requireEmployerContext();
    if (!ctx.success) return ctx;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("job_applications")
      .select(APPLICATION_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      logError("get", error);
      return { success: false, error: ERR.loadOne };
    }

    if (!data) return { success: true, data: null };

    return {
      success: true,
      data: mapApplicationRow(
        normalizeJoinedRow(data as unknown as Record<string, unknown>),
      ),
    };
  },

  async getApplicationsForJob(
    jobId: string,
  ): Promise<ApplicationServiceResult<EmployerApplication[]>> {
    return this.listApplications({ jobId, sort: "newest" });
  },

  async getStats(): Promise<ApplicationServiceResult<ApplicationSummaryStats>> {
    const result = await fetchEmployerApplications();
    if (!result.success) return result;
    return { success: true, data: computeApplicationStats(result.data) };
  },

  async getJobOptions(): Promise<ApplicationServiceResult<JobFilterOption[]>> {
    const ctx = await requireEmployerContext();
    if (!ctx.success) return ctx;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("jobs")
      .select(
        "id, title, sap_module, location, employment_type, work_arrangement, created_at",
      )
      .eq("company_id", ctx.data.companyId)
      .order("created_at", { ascending: false });

    if (error) {
      logError("job options", error);
      return { success: false, error: ERR.load };
    }

    return {
      success: true,
      data: (data ?? []).map((job) => ({
        id: job.id,
        title: job.title,
        sapModule: job.sap_module ?? "—",
        location: job.location ?? "—",
        employmentType: job.employment_type ?? "—",
        workArrangement: job.work_arrangement ?? "—",
      })),
    };
  },

  async updateStatus(
    id: string,
    status: ApplicationStatus,
    notes?: string | null,
  ): Promise<ApplicationServiceResult<EmployerApplication>> {
    const ctx = await requireEmployerContext();
    if (!ctx.success) return ctx;

    const supabase = createClient();
    const payload: {
      status: ApplicationStatus;
      updated_at: string;
      employer_notes?: string | null;
    } = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (notes !== undefined) {
      payload.employer_notes = notes;
    }

    const { error } = await supabase
      .from("job_applications")
      .update(payload)
      .eq("id", id);

    if (error) {
      logError("updateStatus", error);
      return { success: false, error: ERR.updateStatus };
    }

    const refreshed = await this.getApplication(id);
    if (!refreshed.success) return refreshed;
    if (!refreshed.data) return { success: false, error: ERR.notFound };
    return { success: true, data: refreshed.data };
  },

  async updateEmployerNotes(
    id: string,
    notes: string,
  ): Promise<ApplicationServiceResult<EmployerApplication>> {
    const ctx = await requireEmployerContext();
    if (!ctx.success) return ctx;

    const supabase = createClient();
    const { error } = await supabase
      .from("job_applications")
      .update({
        employer_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      logError("updateNotes", error);
      return { success: false, error: ERR.updateNotes };
    }

    const refreshed = await this.getApplication(id);
    if (!refreshed.success) return refreshed;
    if (!refreshed.data) return { success: false, error: ERR.notFound };
    return { success: true, data: refreshed.data };
  },

  async getResumeSignedUrl(
    applicationId: string,
  ): Promise<ApplicationServiceResult<{ url: string; fileName: string }>> {
    const applicationResult = await this.getApplication(applicationId);
    if (!applicationResult.success) {
      return { success: false, error: applicationResult.error };
    }

    const application = applicationResult.data;
    if (!application?.resumePath) {
      return { success: false, error: "No resume available." };
    }

    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from(RESUME_BUCKET)
      .createSignedUrl(application.resumePath, SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      logError("resume signed url", error);
      return { success: false, error: ERR.resume };
    }

    return {
      success: true,
      data: {
        url: data.signedUrl,
        fileName: application.resumeName || "Resume.pdf",
      },
    };
  },

  /** Count applications for a specific job (RLS-scoped). */
  async countForJob(jobId: string): Promise<ApplicationServiceResult<number>> {
    const ctx = await requireEmployerContext();
    if (!ctx.success) return ctx;

    const supabase = createClient();
    const { count, error } = await supabase
      .from("job_applications")
      .select("id", { count: "exact", head: true })
      .eq("job_id", jobId);

    if (error) {
      logError("countForJob", error);
      return { success: false, error: ERR.load };
    }

    return { success: true, data: count ?? 0 };
  },
};
