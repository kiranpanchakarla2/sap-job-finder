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
      const { data: candidate } = await supabase
        .from("candidate_profiles")
        .select("id, profile_completion")
        .eq("user_id", user.id)
        .maybeSingle();

      if (candidate?.id) {
        const [{ count }, resumes] = await Promise.all([
          supabase
            .from("job_applications")
            .select("*", { count: "exact", head: true })
            .eq("candidate_id", candidate.id),
          supabase
            .from("candidate_resumes")
            .select("id")
            .eq("candidate_id", candidate.id)
            .limit(1),
        ]);
        applicationCount = count ?? 0;
        resumeUploaded = Boolean(resumes.data?.length);
        completion = candidate.profile_completion ?? 35;
      }
    } catch {
      // Keep demo defaults when queries fail.
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
    </AppShell>
  );
}
