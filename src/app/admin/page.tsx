import {
  Building2,
  Briefcase,
  ClipboardList,
  FileBarChart,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { requireAdminUser } from "@/lib/auth/session";

const panels = [
  { title: "Users", description: "Manage candidates, recruiters, and roles." },
  { title: "Companies", description: "Approve and curate employer profiles." },
  { title: "Jobs", description: "Moderate listings and featured placements." },
  { title: "Applications", description: "Audit application volume and funnel health." },
  { title: "Reports", description: "Platform analytics and exports." },
] as const;

export default async function AdminDashboardPage() {
  const user = await requireAdminUser();

  return (
    <AppShell user={user}>
      <h1 className="text-2xl font-bold tracking-tight text-text">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-muted">
        Platform control center — management UIs arrive after Candidate MVP.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatsCard label="Users" value="—" icon={Users} />
        <StatsCard label="Companies" value="—" icon={Building2} />
        <StatsCard label="Jobs" value="—" icon={Briefcase} />
        <StatsCard label="Applications" value="—" icon={ClipboardList} />
        <StatsCard label="Reports" value="—" icon={FileBarChart} />
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {panels.map((panel) => (
          <div
            key={panel.title}
            className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft"
          >
            <h2 className="font-semibold text-text">{panel.title}</h2>
            <p className="mt-2 text-sm text-muted">{panel.description}</p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
