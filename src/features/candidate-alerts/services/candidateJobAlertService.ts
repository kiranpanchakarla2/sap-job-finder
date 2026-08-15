import { createClient } from "@/lib/supabase/client";
import type { JobAlert, JobAlertInput } from "../types/alert.types";

export type CandidateJobAlertServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

async function resolveCandidateId(
  supabase: ReturnType<typeof createClient>,
): Promise<CandidateJobAlertServiceResult<string>> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Sign in to manage job alerts.", code: "UNAUTHENTICATED" };
  }

  const { data: rpcId, error: rpcError } = await supabase.rpc("current_candidate_id");
  if (!rpcError && typeof rpcId === "string" && rpcId) {
    return { success: true, data: rpcId };
  }

  const { data: profile, error: profileError } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    return { success: false, error: "Unable to load your candidate profile." };
  }

  if (!profile?.id) {
    return {
      success: false,
      error: "Complete candidate registration before configuring job alerts.",
      code: "NO_CANDIDATE",
    };
  }

  return { success: true, data: profile.id };
}

function parseExperienceMinMax(expStr: string): { min: number | null; max: number | null } {
  if (!expStr?.trim()) return { min: null, max: null };
  const str = expStr.toLowerCase().trim();
  if (str.includes("entry") || str.includes("0-1") || str.includes("0–1")) {
    return { min: 0, max: 1 };
  }
  const rangeMatch = str.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (rangeMatch) {
    return { min: parseInt(rangeMatch[1], 10), max: parseInt(rangeMatch[2], 10) };
  }
  const plusMatch = str.match(/(\d+)\s*\+/);
  if (plusMatch) {
    return { min: parseInt(plusMatch[1], 10), max: null };
  }
  const singleMatch = str.match(/(\d+)/);
  if (singleMatch) {
    return { min: parseInt(singleMatch[1], 10), max: null };
  }
  return { min: null, max: null };
}

type JobAlertDbRow = {
  id: string;
  candidate_id: string;
  name: string;
  keywords: string[] | null;
  sap_module: string | null;
  sap_modules: string[] | null;
  location: string | null;
  experience: string | null;
  experience_min: number | null;
  experience_max: number | null;
  work_mode: string | null;
  employment_type: string | null;
  salary_min: number | string | null;
  salary_max: number | string | null;
  frequency: "instant" | "daily" | "weekly";
  is_active: boolean;
  last_matched_count: number | null;
  created_at: string;
  updated_at: string;
};

function mapRowToJobAlert(row: JobAlertDbRow): JobAlert {
  const sapModules: string[] = Array.isArray(row.sap_modules) && row.sap_modules.length
    ? row.sap_modules
    : row.sap_module
      ? [row.sap_module]
      : [];

  const keywords: string[] = Array.isArray(row.keywords) ? row.keywords : [];

  return {
    id: row.id,
    name: row.name || "SAP Job Alert",
    keywords,
    sapModules,
    location: row.location ?? "",
    experience: row.experience ?? (row.experience_min != null ? `${row.experience_min}${row.experience_max != null ? `–${row.experience_max}` : "+"} Years` : ""),
    workMode: row.work_mode ?? "",
    employmentType: row.employment_type ?? "",
    salaryMin: row.salary_min != null ? Number(row.salary_min) : null,
    salaryMax: row.salary_max != null ? Number(row.salary_max) : null,
    frequency: row.frequency || "daily",
    status: row.is_active ? "active" : "paused",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMatchedCount: row.last_matched_count ?? 0,
  };
}

function formatLimitReachedMessage(rawMessage?: string, planId?: string): string {
  if (planId === "professional") {
    return "You've reached the Professional plan limit of 20 active job alerts. Upgrade to Premium for additional access.";
  }
  if (planId === "free") {
    return "You've reached the Free plan limit of 5 active job alerts. Upgrade to Professional for more active job alerts.";
  }
  if (rawMessage && rawMessage.includes("maximum active job alerts limit")) {
    return rawMessage;
  }
  return "You've reached your active job alerts plan limit. Upgrade your plan to create more.";
}

export const candidateJobAlertService = {
  async getAlerts(): Promise<CandidateJobAlertServiceResult<JobAlert[]>> {
    try {
      const supabase = createClient();
      const candidate = await resolveCandidateId(supabase);

      if (!candidate.success) {
        if (candidate.code === "UNAUTHENTICATED") {
          return { success: true, data: [] };
        }
        return { success: false, error: candidate.error, code: candidate.code };
      }

      const { data, error } = await supabase
        .from("job_alerts")
        .select("*")
        .eq("candidate_id", candidate.data)
        .order("created_at", { ascending: false });

      if (error) {
        return { success: false, error: "Unable to load job alerts." };
      }

      const alerts = (data ?? []).map((row) => mapRowToJobAlert(row as unknown as JobAlertDbRow));
      return { success: true, data: alerts };
    } catch {
      return { success: false, error: "Unable to load job alerts." };
    }
  },

  async createAlert(input: JobAlertInput): Promise<CandidateJobAlertServiceResult<JobAlert>> {
    try {
      const supabase = createClient();
      const candidate = await resolveCandidateId(supabase);

      if (!candidate.success) {
        return { success: false, error: candidate.error, code: candidate.code };
      }

      if (!input.name.trim()) {
        return { success: false, error: "Alert name is required." };
      }

      if (input.salaryMin != null && input.salaryMax != null && input.salaryMin > input.salaryMax) {
        return { success: false, error: "Minimum salary cannot exceed maximum salary." };
      }

      const exp = parseExperienceMinMax(input.experience);

      const { data, error } = await supabase
        .from("job_alerts")
        .insert({
          candidate_id: candidate.data,
          name: input.name.trim(),
          keywords: input.keywords,
          sap_modules: input.sapModules,
          sap_module: input.sapModules[0] ?? null,
          location: input.location.trim() || null,
          experience: input.experience.trim() || null,
          experience_min: exp.min,
          experience_max: exp.max,
          work_mode: input.workMode.trim() || null,
          employment_type: input.employmentType.trim() || null,
          salary_min: input.salaryMin,
          salary_max: input.salaryMax,
          frequency: input.frequency,
          is_active: true,
          last_matched_count: 0,
        })
        .select()
        .single();

      if (error || !data) {
        if (
          error?.message?.includes("ACTIVE_JOB_ALERT_LIMIT_REACHED") ||
          error?.code === "P0001"
        ) {
          const { data: planId } = await supabase.rpc("get_candidate_effective_plan", {
            p_candidate_id: candidate.data,
          });
          return {
            success: false,
            error: formatLimitReachedMessage(error?.message, planId ?? "free"),
            code: "LIMIT_REACHED",
          };
        }
        return { success: false, error: error?.message || "Failed to create job alert. Please try again." };
      }

      return { success: true, data: mapRowToJobAlert(data as unknown as JobAlertDbRow) };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("ACTIVE_JOB_ALERT_LIMIT_REACHED")) {
        return {
          success: false,
          error: "You've reached the active job alerts limit for your plan.",
          code: "LIMIT_REACHED",
        };
      }
      return { success: false, error: "Failed to create job alert. Please try again." };
    }
  },

  async updateAlert(
    id: string,
    input: JobAlertInput,
  ): Promise<CandidateJobAlertServiceResult<JobAlert>> {
    try {
      const supabase = createClient();
      const candidate = await resolveCandidateId(supabase);

      if (!candidate.success) {
        return { success: false, error: candidate.error, code: candidate.code };
      }

      if (!input.name.trim()) {
        return { success: false, error: "Alert name is required." };
      }

      if (input.salaryMin != null && input.salaryMax != null && input.salaryMin > input.salaryMax) {
        return { success: false, error: "Minimum salary cannot exceed maximum salary." };
      }

      const exp = parseExperienceMinMax(input.experience);

      const { data, error } = await supabase
        .from("job_alerts")
        .update({
          name: input.name.trim(),
          keywords: input.keywords,
          sap_modules: input.sapModules,
          sap_module: input.sapModules[0] ?? null,
          location: input.location.trim() || null,
          experience: input.experience.trim() || null,
          experience_min: exp.min,
          experience_max: exp.max,
          work_mode: input.workMode.trim() || null,
          employment_type: input.employmentType.trim() || null,
          salary_min: input.salaryMin,
          salary_max: input.salaryMax,
          frequency: input.frequency,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("candidate_id", candidate.data)
        .select()
        .single();

      if (error || !data) {
        return { success: false, error: "Failed to update job alert. Please try again." };
      }

      return { success: true, data: mapRowToJobAlert(data as unknown as JobAlertDbRow) };
    } catch {
      return { success: false, error: "Failed to update job alert. Please try again." };
    }
  },

  async togglePauseAlert(id: string): Promise<CandidateJobAlertServiceResult<JobAlert>> {
    try {
      const supabase = createClient();
      const candidate = await resolveCandidateId(supabase);

      if (!candidate.success) {
        return { success: false, error: candidate.error, code: candidate.code };
      }

      // First read existing is_active status
      const { data: existing, error: fetchError } = await supabase
        .from("job_alerts")
        .select("is_active")
        .eq("id", id)
        .eq("candidate_id", candidate.data)
        .maybeSingle();

      if (fetchError || !existing) {
        return { success: false, error: "Job alert not found." };
      }

      const nextActive = !existing.is_active;

      const { data, error } = await supabase
        .from("job_alerts")
        .update({
          is_active: nextActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("candidate_id", candidate.data)
        .select()
        .single();

      if (error || !data) {
        if (
          error?.message?.includes("ACTIVE_JOB_ALERT_LIMIT_REACHED") ||
          error?.code === "P0001"
        ) {
          const { data: planId } = await supabase.rpc("get_candidate_effective_plan", {
            p_candidate_id: candidate.data,
          });
          return {
            success: false,
            error: formatLimitReachedMessage(error?.message, planId ?? "free"),
            code: "LIMIT_REACHED",
          };
        }
        return { success: false, error: error?.message || "Failed to change job alert status." };
      }

      return { success: true, data: mapRowToJobAlert(data as unknown as JobAlertDbRow) };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("ACTIVE_JOB_ALERT_LIMIT_REACHED")) {
        return {
          success: false,
          error: "You've reached the active job alerts limit for your plan.",
          code: "LIMIT_REACHED",
        };
      }
      return { success: false, error: "Failed to change job alert status." };
    }
  },

  async deleteAlert(id: string): Promise<CandidateJobAlertServiceResult<true>> {
    try {
      const supabase = createClient();
      const candidate = await resolveCandidateId(supabase);

      if (!candidate.success) {
        return { success: false, error: candidate.error, code: candidate.code };
      }

      const { error } = await supabase
        .from("job_alerts")
        .delete()
        .eq("id", id)
        .eq("candidate_id", candidate.data);

      if (error) {
        return { success: false, error: "Failed to delete job alert." };
      }

      return { success: true, data: true };
    } catch {
      return { success: false, error: "Failed to delete job alert." };
    }
  },
};
