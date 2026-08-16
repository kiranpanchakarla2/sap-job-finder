import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types";

export type CandidateProfile = Tables<"candidate_profiles">;

export type CandidateProfileServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const ERR = {
  auth: "Please sign in again to continue.",
  load: "Unable to load candidate profile.",
  save: "Unable to save candidate profile.",
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
  if (process.env.NODE_ENV !== "production") {
    if (context === "auth" && isAuthSessionMissing(error)) {
      return;
    }
    console.error(`[candidateProfileService] ${context}`, error);
  }
}

export const candidateProfileService = {
  async getCurrentCandidateProfile(): Promise<
    CandidateProfileServiceResult<CandidateProfile | null>
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

    const { data, error } = await supabase
      .from("candidate_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      logError("getCurrent", error);
      return { success: false, error: ERR.load };
    }

    return { success: true, data: data ?? null };
  },

  async getCandidateProfile(
    id: string,
  ): Promise<CandidateProfileServiceResult<CandidateProfile | null>> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("candidate_profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      logError("getById", error);
      return { success: false, error: ERR.load };
    }

    return { success: true, data: data ?? null };
  },

  async createCandidateProfile(
    data: Partial<CandidateProfile> & { user_id: string },
  ): Promise<CandidateProfileServiceResult<CandidateProfile>> {
    const supabase = createClient();
    const { data: created, error } = await supabase
      .from("candidate_profiles")
      .insert(data)
      .select("*")
      .single();

    if (error || !created) {
      logError("create", error);
      return { success: false, error: ERR.save };
    }

    return { success: true, data: created };
  },

  async updateCandidateProfile(
    data: Partial<CandidateProfile>,
  ): Promise<CandidateProfileServiceResult<CandidateProfile>> {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: ERR.auth };
    }

    const { data: updated, error } = await supabase
      .from("candidate_profiles")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error || !updated) {
      logError("update", error);
      return { success: false, error: ERR.save };
    }

    return { success: true, data: updated };
  },
};
