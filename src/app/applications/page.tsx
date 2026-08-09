import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { requireCandidateUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { tryGetSupabaseEnv } from "@/lib/supabase/env";

export default async function ApplicationsPage() {
  const user = await requireCandidateUser("/applications");

  let rows: Array<{
    id: string;
    status: string;
    applied_at: string;
    job_id: string;
    title?: string;
    company?: string;
  }> = [];

  if (tryGetSupabaseEnv()) {
    const supabase = await createClient();
    const { data: candidate } = await supabase
      .from("candidate_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (candidate?.id) {
      const { data } = await supabase
        .from("job_applications")
        .select("id, status, applied_at, job_id, jobs(title, employer_profiles(company_name))")
        .eq("candidate_id", candidate.id)
        .order("applied_at", { ascending: false });

      rows =
        ((data as unknown as Array<{
          id: string;
          status: string;
          applied_at: string;
          job_id: string;
          jobs?: {
            title?: string;
            employer_profiles?: { company_name?: string } | { company_name?: string }[] | null;
          } | null;
        }>) ?? []).map((row) => {
          const job = row.jobs;
          const company = Array.isArray(job?.employer_profiles)
            ? job.employer_profiles[0]
            : job?.employer_profiles;
          return {
            id: row.id,
            status: row.status,
            applied_at: row.applied_at,
            job_id: row.job_id,
            title: job?.title,
            company: company?.company_name,
          };
        });
    }
  }

  return (
    <AppShell user={user}>
      <h1 className="text-2xl font-bold tracking-tight text-text">My Applications</h1>
      <p className="mt-1 text-sm text-muted">Track every role you&apos;ve applied to.</p>

      <div className="mt-6 overflow-hidden rounded-[var(--radius-card)] border border-border bg-card shadow-soft">
        {rows.length ? (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Applied</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border/70 last:border-0">
                  <td className="px-4 py-3 font-medium text-text">
                    <Link href={`/jobs/${row.job_id}`} className="hover:text-primary">
                      {row.title ?? "Job"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{row.company ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-badge px-2.5 py-1 text-xs font-medium text-badge-fg">
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(row.applied_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-4 py-10 text-center text-sm text-muted">
            No applications yet.{" "}
            <Link href="/jobs" className="font-semibold text-primary hover:text-accent">
              Browse SAP jobs
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
