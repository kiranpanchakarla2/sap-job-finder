import { createClient } from "@/lib/supabase/client";
import {
  JOB_CARD_SELECT,
  mapJobRowToDiscovery,
  type DiscoveryJobRow,
} from "../lib/mapJobRow";
import type { DiscoveryJob } from "../types/job.types";

export type CandidateSavedJobServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

async function resolveCandidateId(
  supabase: ReturnType<typeof createClient>,
): Promise<CandidateSavedJobServiceResult<string>> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Sign in to save jobs.", code: "UNAUTHENTICATED" };
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
      error: "Complete candidate registration before saving jobs.",
      code: "NO_CANDIDATE",
    };
  }

  return { success: true, data: profile.id };
}

export const candidateSavedJobService = {
  async getSavedJobIds(): Promise<CandidateSavedJobServiceResult<string[]>> {
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
        .from("saved_jobs")
        .select("job_id")
        .eq("candidate_id", candidate.data);

      if (error) {
        return { success: false, error: "Unable to load saved job IDs." };
      }

      const jobIds = (data ?? []).map((row) => row.job_id).filter(Boolean);
      return { success: true, data: jobIds };
    } catch {
      return { success: false, error: "Unable to load saved job IDs." };
    }
  },

  async getSavedJobs(): Promise<
    CandidateSavedJobServiceResult<Array<DiscoveryJob & { savedAt: string }>>
  > {
    try {
      const supabase = createClient();
      const candidate = await resolveCandidateId(supabase);

      if (!candidate.success) {
        if (candidate.code === "UNAUTHENTICATED") {
          return { success: true, data: [] };
        }
        return { success: false, error: candidate.error, code: candidate.code };
      }

      const { data: savedRows, error: savedError } = await supabase
        .from("saved_jobs")
        .select("created_at, job_id")
        .eq("candidate_id", candidate.data)
        .order("created_at", { ascending: false });

      if (savedError) {
        return { success: false, error: "Unable to load saved jobs." };
      }

      const rows = savedRows ?? [];
      if (!rows.length) {
        return { success: true, data: [] };
      }

      const jobIds = rows.map((row) => row.job_id);
      const { data: jobRows, error: jobsError } = await supabase
        .from("jobs")
        .select(JOB_CARD_SELECT)
        .in("id", jobIds);

      if (jobsError) {
        return { success: false, error: "Unable to load job details." };
      }

      const jobMap = new Map(
        ((jobRows ?? []) as unknown as DiscoveryJobRow[]).map((job) => [job.id, job]),
      );

      const jobs: Array<DiscoveryJob & { savedAt: string }> = [];
      for (const row of rows) {
        const jobRow = jobMap.get(row.job_id);
        if (jobRow) {
          jobs.push({
            ...mapJobRowToDiscovery(jobRow),
            savedAt: row.created_at,
          });
        }
      }

      return { success: true, data: jobs };
    } catch {
      return { success: false, error: "Unable to load saved jobs." };
    }
  },

  async isJobSaved(jobId: string): Promise<CandidateSavedJobServiceResult<boolean>> {
    try {
      const supabase = createClient();
      const candidate = await resolveCandidateId(supabase);

      if (!candidate.success) {
        if (candidate.code === "UNAUTHENTICATED") {
          return { success: true, data: false };
        }
        return { success: false, error: candidate.error, code: candidate.code };
      }

      const { data, error } = await supabase
        .from("saved_jobs")
        .select("id")
        .eq("candidate_id", candidate.data)
        .eq("job_id", jobId)
        .maybeSingle();

      if (error) {
        return { success: false, error: "Unable to check saved status." };
      }

      return { success: true, data: Boolean(data?.id) };
    } catch {
      return { success: false, error: "Unable to check saved status." };
    }
  },

  async saveJob(jobId: string): Promise<CandidateSavedJobServiceResult<true>> {
    try {
      const supabase = createClient();
      const candidate = await resolveCandidateId(supabase);

      if (!candidate.success) {
        return { success: false, error: candidate.error, code: candidate.code };
      }

      const { error } = await supabase.from("saved_jobs").insert({
        candidate_id: candidate.data,
        job_id: jobId,
      });

      if (error) {
        // Code 23505 is PostgreSQL unique constraint violation (duplicate save)
        if (error.code === "23505") {
          return { success: true, data: true };
        }
        return { success: false, error: "Failed to save job. Please try again." };
      }

      return { success: true, data: true };
    } catch {
      return { success: false, error: "Failed to save job. Please try again." };
    }
  },

  async unsaveJob(jobId: string): Promise<CandidateSavedJobServiceResult<true>> {
    try {
      const supabase = createClient();
      const candidate = await resolveCandidateId(supabase);

      if (!candidate.success) {
        return { success: false, error: candidate.error, code: candidate.code };
      }

      const { error } = await supabase
        .from("saved_jobs")
        .delete()
        .eq("candidate_id", candidate.data)
        .eq("job_id", jobId);

      if (error) {
        return { success: false, error: "Failed to remove saved job. Please try again." };
      }

      return { success: true, data: true };
    } catch {
      return { success: false, error: "Failed to remove saved job. Please try again." };
    }
  },
};
