import { createClient } from "@/lib/supabase/client";

export type ApplicationRow = {
  id: string;
  job_id: string;
  status: string;
  applied_at: string;
  jobs?: {
    title: string;
    location: string;
    companies?: { name: string; logo: string | null } | null;
  } | null;
};

export async function applyToJob(jobId: string, candidateId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("applications")
    .upsert(
      {
        job_id: jobId,
        candidate_id: candidateId,
        status: "applied",
      },
      { onConflict: "job_id,candidate_id" },
    )
    .select("id")
    .single();

  return { data, error };
}

export async function listMyApplications(candidateId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("applications")
    .select(
      "id, job_id, status, applied_at, jobs(title, location, companies(name, logo))",
    )
    .eq("candidate_id", candidateId)
    .order("applied_at", { ascending: false });

  return { data: (data as ApplicationRow[] | null) ?? [], error };
}

export async function hasApplied(jobId: string, candidateId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("applications")
    .select("id")
    .eq("job_id", jobId)
    .eq("candidate_id", candidateId)
    .maybeSingle();

  return Boolean(data);
}
