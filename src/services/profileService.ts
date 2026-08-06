import { createClient } from "@/lib/supabase/client";
import type { Database, Json, UserRole } from "@/types/database";

export type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  location: string | null;
  headline: string | null;
  role: UserRole | null;
};

export type CandidateProfileRow = {
  user_id: string;
  experience_years: number | null;
  skills: string[] | null;
  education: unknown;
  certifications: unknown;
  summary: string | null;
  completion_percent: number | null;
};

export async function getProfile(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return { data: data as ProfileRow | null, error };
}

export async function updateProfile(
  userId: string,
  values: Partial<
    Pick<ProfileRow, "full_name" | "phone" | "location" | "headline">
  >,
) {
  const supabase = createClient();
  const payload: Database["public"]["Tables"]["profiles"]["Insert"] = {
    id: userId,
    full_name: values.full_name,
    phone: values.phone,
    location: values.location,
    headline: values.headline,
  };
  return supabase.from("profiles").upsert(payload);
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
  values: {
    experience_years?: number | null;
    skills?: string[];
    education?: Json | null;
    certifications?: Json | null;
    summary?: string | null;
    completion_percent?: number;
  },
) {
  const supabase = createClient();
  const payload: Database["public"]["Tables"]["candidate_profiles"]["Insert"] = {
    user_id: userId,
    experience_years: values.experience_years,
    skills: values.skills,
    education: values.education,
    certifications: values.certifications,
    summary: values.summary,
    completion_percent: values.completion_percent,
  };
  return supabase.from("candidate_profiles").upsert(payload);
}

export async function uploadResume(userId: string, file: File) {
  const supabase = createClient();
  const path = `${userId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    return { error: uploadError };
  }

  const { data, error } = await supabase
    .from("resumes")
    .upsert(
      {
        user_id: userId,
        storage_path: path,
        filename: file.name,
        uploaded_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("*")
    .single();

  return { data, error };
}

export async function getResume(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return { data, error };
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
