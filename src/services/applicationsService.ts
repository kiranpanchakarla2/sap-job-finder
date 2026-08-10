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

export async function applyToJob(jobId: string, candidateProfileId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("job_applications")
    .upsert(
      {
        job_id: jobId,
        candidate_id: candidateProfileId,
        status: "new",
      },
      { onConflict: "job_id,candidate_id" },
    )
    .select("id")
    .single();

  if (error?.code === "23505") {
    return {
      data: null,
      error: { ...error, message: "You have already applied to this job." },
    };
  }

  return { data, error };
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
