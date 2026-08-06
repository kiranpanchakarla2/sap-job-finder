import {
  Briefcase,
  FileText,
  PhoneCall,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { JobCard } from "@/components/jobs/JobCard";
import { requireCandidateUser } from "@/lib/auth/session";
import { mockJobs } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import { tryGetSupabaseEnv } from "@/lib/supabase/env";

export default async function DashboardPage() {
  const user = await requireCandidateUser();

  let applicationCount = 0;
  let resumeUploaded = false;
  let completion = 35;

  if (tryGetSupabaseEnv()) {
    try {
      const supabase = await createClient();
      const [{ count }, resumeRes, profileRes, candidateRes] = await Promise.all([
        supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .eq("candidate_id", user.id),
        supabase.from("resumes").select("id").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase
          .from("candidate_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      applicationCount = count ?? 0;
      resumeUploaded = Boolean(resumeRes.data);
      const checks = [
        Boolean(profileRes.data?.full_name || user.fullName),
        Boolean(profileRes.data?.phone),
        Boolean(profileRes.data?.location),
        Boolean(profileRes.data?.headline),
        Boolean(candidateRes.data?.skills?.length),
        Boolean(candidateRes.data?.summary),
        resumeUploaded,
      ];
      completion = Math.round((checks.filter(Boolean).length / checks.length) * 100);
    } catch {
      // Tables may not exist yet — keep demo defaults.
    }
  }

  const recommended = mockJobs.slice(0, 3);

  return (
    <AppShell user={user}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Welcome, {user.fullName.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted">
          Here&apos;s your SAP job search at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Profile completion"
          value={`${completion}%`}
          icon={UserRound}
          hint="Complete your profile to get better matches"
        />
        <StatsCard
          label="Resume"
          value={resumeUploaded ? "Uploaded" : "Missing"}
          icon={FileText}
          hint={resumeUploaded ? "Ready for applications" : "Upload from Profile → Resume"}
        />
        <StatsCard
          label="Applications"
          value={applicationCount}
          icon={Briefcase}
          hint="Track status in My Applications"
        />
        <StatsCard
          label="Interview calls"
          value={0}
          icon={PhoneCall}
          hint="Updates appear when recruiters shortlist you"
        />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-text">Recommended jobs</h2>
        <div className="mt-4 grid auto-rows-fr gap-4 lg:grid-cols-3">
          {recommended.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-text">Recent activity</h2>
        <div className="mt-4 rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
          <ul className="space-y-3 text-sm text-muted">
            <li>Welcome to SAP Jobs Finder — complete your profile to unlock recommendations.</li>
            <li>Browse featured SAP Commerce, ABAP, and Fiori roles.</li>
            {applicationCount > 0 ? (
              <li>You have {applicationCount} active application(s).</li>
            ) : (
              <li>No applications yet — find a role and apply.</li>
            )}
          </ul>
        </div>
      </section>
    </AppShell>
  );
}
