import { createClient } from "@/lib/supabase/client";

export type ApplicationRow = {
  id: string;
  job_id: string;
  status: string;
  applied_at: string;
  jobs?: {
    title: string;
    location: string | null;
    employer_profiles?: { company_name: string; company_logo_url: string | null } | null;
  } | null;
};

export async function applyToJob(jobId: string, _candidateProfileId?: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("submit_candidate_application", {
    p_job_id: jobId,
    p_resume_id: null,
    p_cover_letter: "",
    p_answers: [],
  } as never);

  if (error) {
    if (error.code === "23505" || error.message?.includes("already applied")) {
      return {
        data: null,
        error: { ...error, message: "You have already applied to this job." },
      };
    }
    return { data: null, error };
  }

  return { data: { id: data }, error: null };
}

export async function listMyApplications(candidateProfileId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("job_applications")
    .select(
      "id, job_id, status, applied_at, jobs(title, location, employer_profiles(company_name, company_logo_url))",
    )
    .eq("candidate_id", candidateProfileId)
    .order("applied_at", { ascending: false });

  return { data: (data as ApplicationRow[] | null) ?? [], error };
}

export async function hasApplied(jobId: string, candidateProfileId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("job_applications")
    .select("id")
    .eq("job_id", jobId)
    .eq("candidate_id", candidateProfileId)
    .maybeSingle();

  return Boolean(data);
}
