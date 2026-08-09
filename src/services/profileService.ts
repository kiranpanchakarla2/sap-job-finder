import { createClient } from "@/lib/supabase/client";
import type { AppRole } from "@/types/database";

export type ProfileRow = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: AppRole | null;
};

export type CandidateProfileRow = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  current_city: string | null;
  headline: string | null;
  about_me: string | null;
  years_of_experience: number;
  profile_completion: number;
};

export async function getProfile(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return { data: data as ProfileRow | null, error };
}

export async function updateProfile(
  userId: string,
  values: Partial<Pick<ProfileRow, "first_name" | "last_name" | "phone" | "avatar_url">>,
) {
  const supabase = createClient();
  return supabase.from("profiles").update(values).eq("user_id", userId);
}

export async function getCandidateProfile(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return { data: data as CandidateProfileRow | null, error };
}

export async function updateCandidateProfile(
  userId: string,
  values: Partial<
    Pick<
      CandidateProfileRow,
      | "first_name"
      | "last_name"
      | "phone"
      | "current_city"
      | "headline"
      | "about_me"
      | "years_of_experience"
      | "profile_completion"
    >
  >,
) {
  const supabase = createClient();
  return supabase.from("candidate_profiles").update(values).eq("user_id", userId);
}

export function computeProfileCompletion(input: {
  fullName?: string | null;
  phone?: string | null;
  location?: string | null;
  headline?: string | null;
  skills?: string[] | null;
  summary?: string | null;
  hasResume?: boolean;
}) {
  const checks = [
    Boolean(input.fullName),
    Boolean(input.phone),
    Boolean(input.location),
    Boolean(input.headline),
    Boolean(input.skills?.length),
    Boolean(input.summary),
    Boolean(input.hasResume),
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}
