import { createClient } from "@/lib/supabase/client";
import type { JobFormValues } from "../lib/validation";
import {
  formValuesToJobWrite,
  JOB_SELECT,
  mapJobRow,
  toDbJobStatus,
  toUiJobStatus,
  type JobRow,
} from "../lib/mappers";
import { assertTransition } from "../lib/statusTransitions";
import type { EmployerJobRecord, JobStatus } from "../types/job.types";
import type {
  BulkImportJobPayloadItem,
  BulkImportResult,
  BulkJobValidationRow,
  ImportResultRow,
} from "../types/bulkUpload.types";

export type JobServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

type OwnershipContext = {
  userId: string;
  companyId: string;
  employerId: string;
  companyName: string;
  logoUrl: string | null;
};

const ERR = {
  loadJobs: "Unable to load your jobs. Please try again.",
  loadJob: "Unable to load this job. Please try again.",
  create: "Unable to create this job. Please try again.",
  update: "Unable to save your changes. Please try again.",
  publish: "Unable to publish this job. Please try again.",
  pause: "Unable to pause this job. Please try again.",
  resume: "Unable to resume this job. Please try again.",
  close: "Unable to close this job. Please try again.",
  delete: "Unable to delete this draft. Please try again.",
  duplicate: "Unable to duplicate this job. Please try again.",
  companyProfile:
    "Complete your company profile before posting a job.",
  auth: "Please sign in again to continue.",
  notFound: "Job not found.",
} as const;

function isAuthSessionMissing(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { name?: string; message?: string };
  return (
    e.name === "AuthSessionMissingError" ||
    (typeof e.message === "string" && e.message.toLowerCase().includes("auth session missing"))
  );
}

function logError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production" && error !== null && error !== undefined) {
    if (context === "auth" && isAuthSessionMissing(error)) {
      return;
    }
    console.error(`[jobService] ${context}`, error);
  }
}

function mapDbJobError(error: unknown, fallback: string): string {
  const message =
    typeof error === "object" &&
    error &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
      ? (error as { message: string }).message
      : "";

  if (message.includes("ACTIVE_JOB_LIMIT_REACHED")) {
    return "Your active job limit has been reached. Upgrade your plan to post more jobs.";
  }

  if (message.includes("FORBIDDEN_PLAN_UPGRADE_REQUIRED")) {
    return "Bulk Job Upload requires a Pro or Business subscription. Please upgrade your plan to import jobs via Excel.";
  }

  if (message.includes("FORBIDDEN_BULK_UPLOAD_PERMISSION_DENIED")) {
    return "You do not have permission to bulk upload jobs for this company. Please contact your company administrator.";
  }

  return fallback;
}

async function requireOwnershipContext(): Promise<
  JobServiceResult<OwnershipContext>
> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    if (authError) logError("auth", authError);
    return { success: false, error: ERR.auth };
  }

  // 1. Resolve Company Profile (supports direct company owners & invited team members)
  let companyId: string | null = null;
  let companyName = "Your company";
  let logoUrl: string | null = null;
  let setupComplete = false;
  let companyOwnerUserId: string | null = null;

  // First check if user directly owns a company profile
  const { data: directCompany, error: directCompanyError } = await supabase
    .from("company_profiles")
    .select("id, user_id, company_name, logo_url, setup_complete")
    .eq("user_id", user.id)
    .maybeSingle();

  if (directCompany?.id) {
    companyId = directCompany.id;
    companyOwnerUserId = directCompany.user_id;
    companyName = directCompany.company_name ?? companyName;
    logoUrl = directCompany.logo_url ?? null;
    setupComplete = Boolean(directCompany.setup_complete);
  } else {
    // Check employer_accounts (for recruiters / team members)
    const { data: account, error: accountError } = await supabase
      .from("employer_accounts")
      .select("company_id, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (account?.company_id) {
      const { data: accountCompany, error: accountCompError } = await supabase
        .from("company_profiles")
        .select("id, user_id, company_name, logo_url, setup_complete")
        .eq("id", account.company_id)
        .maybeSingle();

      if (accountCompany?.id) {
        companyId = accountCompany.id;
        companyOwnerUserId = accountCompany.user_id;
        companyName = accountCompany.company_name ?? companyName;
        logoUrl = accountCompany.logo_url ?? null;
        setupComplete = Boolean(accountCompany.setup_complete);
      } else if (accountCompError) {
        logError("account company profile", accountCompError);
      }
    } else if (accountError) {
      logError("employer account lookup", accountError);
    }
  }

  if (directCompanyError && !companyId) {
    logError("company profile", directCompanyError);
    return { success: false, error: ERR.companyProfile };
  }

  if (!companyId || !setupComplete) {
    return { success: false, error: ERR.companyProfile };
  }

  // 2. Resolve Employer Profile
  let employerId: string | null = null;

  // Try user's own employer_profile
  const { data: employer, error: employerError } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (employer?.id) {
    employerId = employer.id;
  } else if (employerError) {
    logError("employer profile fetch", employerError);
  }

  // If missing, check if company owner has an employer_profile
  if (!employerId && companyOwnerUserId && companyOwnerUserId !== user.id) {
    const { data: ownerEmployer } = await supabase
      .from("employer_profiles")
      .select("id")
      .eq("user_id", companyOwnerUserId)
      .maybeSingle();

    if (ownerEmployer?.id) {
      employerId = ownerEmployer.id;
    }
  }

  // If still missing, attempt to self-heal and insert employer_profile for user
  if (!employerId) {
    const { data: createdEmployer, error: createError } = await supabase
      .from("employer_profiles")
      .insert({
        user_id: user.id,
        company_name: companyName,
      })
      .select("id")
      .maybeSingle();

    if (createdEmployer?.id) {
      employerId = createdEmployer.id;
    } else if (createError) {
      // Check fallback to company owner employer profile
      if (companyOwnerUserId) {
        const { data: fallbackOwner } = await supabase
          .from("employer_profiles")
          .select("id")
          .eq("user_id", companyOwnerUserId)
          .maybeSingle();
        if (fallbackOwner?.id) {
          employerId = fallbackOwner.id;
        }
      }
    }
  }

  if (!employerId) {
    return { success: false, error: ERR.companyProfile };
  }

  return {
    success: true,
    data: {
      userId: user.id,
      companyId,
      employerId,
      companyName,
      logoUrl,
    },
  };
}

async function getCompanyBrandById(companyId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("company_profiles")
    .select("company_name, logo_url")
    .eq("id", companyId)
    .maybeSingle();

  return {
    companyName: data?.company_name ?? "Your company",
    logoUrl: data?.logo_url ?? null,
  };
}

function mapRow(
  row: JobRow,
  company?: { companyName?: string; logoUrl?: string | null },
): EmployerJobRecord {
  return mapJobRow(row, company, 0);
}

async function fetchJobRow(id: string): Promise<JobServiceResult<JobRow>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    logError("fetchJobRow", error);
    return { success: false, error: ERR.loadJob };
  }
  if (!data) return { success: false, error: ERR.notFound };
  return { success: true, data: data as JobRow };
}

async function transitionStatus(
  id: string,
  target: JobStatus,
  errorMessage: string,
): Promise<JobServiceResult<EmployerJobRecord>> {
  const rowResult = await fetchJobRow(id);
  if (!rowResult.success) return rowResult;

  const current = toUiJobStatus(rowResult.data.status);
  const transitionError = assertTransition(current, target);
  if (transitionError) return { success: false, error: transitionError };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("jobs")
    .update({ status: toDbJobStatus(target) })
    .eq("id", id)
    .select(JOB_SELECT)
    .single();

  if (error || !data) {
    logError(`transitionStatus ${target}`, error);
    return {
      success: false,
      error: mapDbJobError(error, errorMessage),
    };
  }

  const brand = await getCompanyBrandById((data as JobRow).company_id);
  return { success: true, data: mapRow(data as JobRow, brand) };
}

export const jobService = {
  /** Alias for listJobs */
  getJobs: () => jobService.listJobs(),

  listJobs: async (): Promise<JobServiceResult<EmployerJobRecord[]>> => {
    const ctx = await requireOwnershipContext();
    if (!ctx.success) return ctx;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("jobs")
      .select(JOB_SELECT)
      .eq("company_id", ctx.data.companyId)
      .order("created_at", { ascending: false });

    if (error) {
      logError("listJobs", error);
      return { success: false, error: ERR.loadJobs };
    }

    const brand = {
      companyName: ctx.data.companyName,
      logoUrl: ctx.data.logoUrl,
    };

    const jobIds = ((data ?? []) as JobRow[]).map((row) => row.id);
    const countByJob = new Map<string, number>();

    if (jobIds.length > 0) {
      const { data: apps, error: appsError } = await supabase
        .from("job_applications")
        .select("job_id")
        .in("job_id", jobIds);

      if (appsError) {
        logError("listJobs application counts", appsError);
      } else {
        for (const app of apps ?? []) {
          countByJob.set(app.job_id, (countByJob.get(app.job_id) ?? 0) + 1);
        }
      }
    }

    return {
      success: true,
      data: ((data ?? []) as JobRow[]).map((row) =>
        mapJobRow(row, brand, countByJob.get(row.id) ?? 0),
      ),
    };
  },

  /** Alias for getJob */
  getJobById: (id: string) => jobService.getJob(id),

  getJob: async (id: string): Promise<JobServiceResult<EmployerJobRecord>> => {
    const rowResult = await fetchJobRow(id);
    if (!rowResult.success) return rowResult;

    const brand = await getCompanyBrandById(rowResult.data.company_id);
    return { success: true, data: mapRow(rowResult.data, brand) };
  },

  createJob: async (
    values: JobFormValues,
    options?: { publish?: boolean },
  ): Promise<JobServiceResult<EmployerJobRecord>> => {
    const ctx = await requireOwnershipContext();
    if (!ctx.success) return ctx;

    const publish = options?.publish ?? false;
    const payload = {
      ...formValuesToJobWrite(values, {
        status: publish ? "active" : "draft",
      }),
      company_id: ctx.data.companyId,
      employer_id: ctx.data.employerId,
      created_by: ctx.data.userId,
    };

    const supabase = createClient();
    const { data, error } = await supabase
      .from("jobs")
      .insert(payload)
      .select(JOB_SELECT)
      .single();

    if (error || !data) {
      logError("createJob", error);
      return { success: false, error: mapDbJobError(error, ERR.create) };
    }

    return {
      success: true,
      data: mapRow(data as JobRow, {
        companyName: ctx.data.companyName,
        logoUrl: ctx.data.logoUrl,
      }),
    };
  },

  updateJob: async (
    id: string,
    values: JobFormValues,
  ): Promise<JobServiceResult<EmployerJobRecord>> => {
    const existing = await fetchJobRow(id);
    if (!existing.success) return existing;

    if (toUiJobStatus(existing.data.status) === "Closed") {
      return { success: false, error: "Closed jobs cannot be edited." };
    }

    const payload = formValuesToJobWrite(values);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("jobs")
      .update(payload)
      .eq("id", id)
      .select(JOB_SELECT)
      .single();

    if (error || !data) {
      logError("updateJob", error);
      return { success: false, error: ERR.update };
    }

    const brand = await getCompanyBrandById((data as JobRow).company_id);
    return { success: true, data: mapRow(data as JobRow, brand) };
  },

  publishJob: async (id: string): Promise<JobServiceResult<EmployerJobRecord>> => {
    const rowResult = await fetchJobRow(id);
    if (!rowResult.success) return rowResult;

    const current = toUiJobStatus(rowResult.data.status);
    const transitionError = assertTransition(current, "Active");
    if (transitionError) return { success: false, error: transitionError };

    const supabase = createClient();
    const { data, error } = await supabase
      .from("jobs")
      .update({
        status: "active",
        published_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(JOB_SELECT)
      .single();

    if (error || !data) {
      logError("publishJob", error);
      return { success: false, error: mapDbJobError(error, ERR.publish) };
    }

    const brand = await getCompanyBrandById((data as JobRow).company_id);
    return { success: true, data: mapRow(data as JobRow, brand) };
  },

  pauseJob: (id: string) => transitionStatus(id, "Paused", ERR.pause),

  resumeJob: (id: string) => transitionStatus(id, "Active", ERR.resume),

  closeJob: (id: string) => transitionStatus(id, "Closed", ERR.close),

  /** @deprecated Use pauseJob / resumeJob / closeJob */
  setStatus: (id: string, status: JobStatus) => {
    if (status === "Paused") return jobService.pauseJob(id);
    if (status === "Active") return jobService.resumeJob(id);
    if (status === "Closed") return jobService.closeJob(id);
    return jobService.publishJob(id);
  },

  deleteDraftJob: async (id: string): Promise<JobServiceResult<null>> => {
    const rowResult = await fetchJobRow(id);
    if (!rowResult.success) return rowResult;

    if (toUiJobStatus(rowResult.data.status) !== "Draft") {
      return {
        success: false,
        error: "Only draft jobs can be deleted.",
      };
    }

    const supabase = createClient();
    const { error } = await supabase.from("jobs").delete().eq("id", id);

    if (error) {
      logError("deleteDraftJob", error);
      return { success: false, error: ERR.delete };
    }

    return { success: true, data: null };
  },

  /** @deprecated Use deleteDraftJob */
  deleteDraft: (id: string) => jobService.deleteDraftJob(id),

  duplicateJob: async (
    id: string,
  ): Promise<JobServiceResult<EmployerJobRecord>> => {
    const ctx = await requireOwnershipContext();
    if (!ctx.success) return ctx;

    const sourceResult = await fetchJobRow(id);
    if (!sourceResult.success) return sourceResult;

    const source = sourceResult.data;
    const payload = {
      company_id: ctx.data.companyId,
      employer_id: ctx.data.employerId,
      created_by: ctx.data.userId,
      title: `Copy of ${source.title}`,
      employment_type: source.employment_type,
      job_type: source.job_type,
      experience_level: source.experience_level,
      location: source.location,
      work_arrangement: source.work_arrangement,
      sap_module: source.sap_module,
      sap_specialization: source.sap_specialization,
      sap_version: source.sap_version,
      project_type: source.project_type,
      industry: source.industry,
      description: source.description,
      responsibilities: source.responsibilities,
      required_skills: source.required_skills,
      preferred_skills: source.preferred_skills,
      minimum_experience: source.minimum_experience,
      maximum_experience: source.maximum_experience,
      salary_type: source.salary_type,
      salary_min: source.salary_min,
      salary_max: source.salary_max,
      currency: source.currency,
      salary_visible: source.salary_visible,
      benefits: source.benefits,
      number_of_openings: source.number_of_openings,
      application_deadline: source.application_deadline,
      recruiter_name: source.recruiter_name,
      application_email: source.application_email,
      application_url: source.application_url,
      status: "draft" as const,
      published_at: null,
      closed_at: null,
    };

    const supabase = createClient();
    const { data, error } = await supabase
      .from("jobs")
      .insert(payload)
      .select(JOB_SELECT)
      .single();

    if (error || !data) {
      logError("duplicateJob", error);
      return { success: false, error: ERR.duplicate };
    }

    return {
      success: true,
      data: mapRow(data as JobRow, {
        companyName: ctx.data.companyName,
        logoUrl: ctx.data.logoUrl,
      }),
    };
  },

  getCompanyProfileStatus: async (): Promise<
    JobServiceResult<{ ready: boolean; companyName: string; logoUrl: string | null }>
  > => {
    const ctx = await requireOwnershipContext();
    if (!ctx.success) {
      return {
        success: true,
        data: { ready: false, companyName: "", logoUrl: null },
      };
    }
    return {
      success: true,
      data: {
        ready: true,
        companyName: ctx.data.companyName,
        logoUrl: ctx.data.logoUrl,
      },
    };
  },

  getDashboardJobStats: async (): Promise<
    JobServiceResult<{
      activeJobs: number;
      draftJobs: number;
      totalApplications: number;
      recentJobs: EmployerJobRecord[];
    }>
  > => {
    const listResult = await jobService.listJobs();
    if (!listResult.success) return listResult;

    const jobs = listResult.data;
    const activeJobs = jobs.filter((job) => job.status === "Active").length;
    const draftJobs = jobs.filter((job) => job.status === "Draft").length;
    const recentJobs = [...jobs]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);

    const totalApplications = jobs.reduce(
      (sum, job) => sum + (job.applications ?? 0),
      0,
    );

    return {
      success: true,
      data: {
        activeJobs,
        draftJobs,
        totalApplications,
        recentJobs,
      },
    };
  },

  bulkImportJobs: async (
    rows: BulkJobValidationRow[],
    metadata?: {
      fileName?: string;
      fileSize?: number | null;
      fileType?: string;
      totalRows?: number;
    },
  ): Promise<JobServiceResult<BulkImportResult>> => {
    const ctx = await requireOwnershipContext();
    if (!ctx.success) return ctx;

    // Filter out invalid/error rows client-side before sending to server RPC
    const eligibleRows = rows.filter((r) => r.status !== "error");
    if (eligibleRows.length === 0) {
      return {
        success: false,
        error: "No valid jobs selected for import.",
      };
    }

    const payload: BulkImportJobPayloadItem[] = eligibleRows.map((r) => ({
      rowNumber: r.rowNumber,
      title: r.data.title,
      description: r.data.description,
      sapModule: r.data.sapModule,
      jobType: r.data.jobType,
      employmentType: r.data.employmentType,
      minExperience: r.data.minExperience,
      maxExperience: r.data.maxExperience,
      location: r.data.location,
      workMode: r.data.workMode,
      country: r.data.country,
      skills: r.data.skills,
      minSalary: r.data.minSalary,
      maxSalary: r.data.maxSalary,
      currency: r.data.currency,
      noticePeriod: r.data.noticePeriod,
      education: r.data.education,
      openings: r.data.openings,
      deadline: r.data.deadline,
      contactEmail: r.data.contactEmail,
    }));

    const supabase = createClient();
    const { data, error } = await supabase.rpc("bulk_import_jobs", {
      p_jobs: payload as never,
      p_metadata: (metadata ?? null) as never,
    });

    if (error) {
      logError("bulkImportJobs", error);
      return {
        success: false,
        error: mapDbJobError(
          error,
          "Unable to complete bulk job import. Please check your company permissions and try again.",
        ),
      };
    }

    const raw = data as {
      importId?: string;
      status?: "processing" | "completed" | "completed_with_warnings" | "failed";
      totalSelected?: number;
      created?: ImportResultRow[];
      skipped?: ImportResultRow[];
      failed?: ImportResultRow[];
    } | null;

    const result: BulkImportResult = {
      importId: raw?.importId,
      status: raw?.status ?? "completed",
      totalSelected: raw?.totalSelected ?? eligibleRows.length,
      created: Array.isArray(raw?.created) ? raw.created : [],
      skipped: Array.isArray(raw?.skipped) ? raw.skipped : [],
      failed: Array.isArray(raw?.failed) ? raw.failed : [],
    };

    return {
      success: true,
      data: result,
    };
  },
};

