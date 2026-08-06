import {
  BarChart3,
  Briefcase,
  ClipboardList,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { requireRecruiterUser } from "@/lib/auth/session";

export default async function RecruiterDashboardPage() {
  const user = await requireRecruiterUser();

  return (
    <AppShell user={user}>
      <h1 className="text-2xl font-bold tracking-tight text-text">Recruiter Dashboard</h1>
      <p className="mt-1 text-sm text-muted">
        Post jobs and review applicants — full CRUD lands in the next slice.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Jobs posted" value="—" icon={Briefcase} hint="Coming soon" />
        <StatsCard label="Applications" value="—" icon={ClipboardList} hint="Coming soon" />
        <StatsCard label="Interviews" value="—" icon={Users} hint="Coming soon" />
        <StatsCard label="Shortlisted" value="—" icon={BarChart3} hint="Coming soon" />
      </div>

      <div className="mt-10 rounded-[var(--radius-card)] border border-dashed border-border bg-card p-8 text-center shadow-soft">
        <p className="font-semibold text-text">Recruiter tools shell</p>
        <p className="mt-2 text-sm text-muted">
          Company profile, post job, and applicant review will plug in here after Candidate MVP.
        </p>
      </div>
    </AppShell>
  );
}
