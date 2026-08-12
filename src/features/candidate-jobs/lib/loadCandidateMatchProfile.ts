import { createClient } from "@/lib/supabase/client";
import type { CandidateMatchProfile, WorkMode } from "../types/job.types";

function parseExperienceYears(value: number | null | undefined, band?: string | null): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (!band) return 0;
  const match = band.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function mapWorkModes(values: string[] | null | undefined): WorkMode[] {
  const modes: WorkMode[] = [];
  for (const value of values ?? []) {
    const normalized = value.toLowerCase();
    if (normalized.includes("remote")) modes.push("Remote");
    else if (normalized.includes("hybrid")) modes.push("Hybrid");
    else if (normalized.includes("on")) modes.push("On-site");
  }
  return [...new Set(modes)];
}

/**
 * Builds a match profile from the authenticated candidate's Sprint 1 profile data.
 * Falls back to an empty profile (recommendations become "latest jobs").
 */
export async function loadCandidateMatchProfile(): Promise<CandidateMatchProfile> {
  const empty: CandidateMatchProfile = {
    skills: [],
    sapModules: [],
    experienceYears: 0,
    preferredLocations: [],
    workModes: [],
    preferredJobRoles: [],
  };

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return empty;

    const { data: profile } = await supabase
      .from("candidate_profiles")
      .select(
        "skills, sap_skills, preferred_sap_modules, preferred_locations, preferred_job_roles, work_modes, open_to_work_modes, total_experience, years_of_experience, experience_band, current_city, location",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) return empty;

    const skills = [
      ...(profile.skills ?? []),
      ...(profile.sap_skills ?? []),
    ].filter(Boolean);

    const sapModules = [
      ...(profile.preferred_sap_modules ?? []),
      ...(profile.sap_skills ?? []),
    ].filter(Boolean);

    const preferredLocations = [
      ...(profile.preferred_locations ?? []),
      profile.current_city,
      profile.location,
    ].filter((v): v is string => Boolean(v));

    return {
      skills: [...new Set(skills)],
      sapModules: [...new Set(sapModules)],
      experienceYears: parseExperienceYears(
        profile.total_experience ?? profile.years_of_experience,
        profile.experience_band,
      ),
      preferredLocations: [...new Set(preferredLocations)],
      workModes: mapWorkModes([
        ...(profile.work_modes ?? []),
        ...(profile.open_to_work_modes ?? []),
      ]),
      preferredJobRoles: [...new Set(profile.preferred_job_roles ?? [])],
    };
  } catch {
    return empty;
  }
}
