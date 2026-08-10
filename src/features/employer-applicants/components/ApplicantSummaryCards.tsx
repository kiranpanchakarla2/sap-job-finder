import {
  CalendarDays,
  ClipboardList,
  Heart,
  Sparkles,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import type { ApplicationSummaryStats } from "../types/application.types";

export function ApplicantSummaryCards({
  stats,
}: {
  stats: ApplicationSummaryStats;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Total Applicants" value={stats.total} icon={Users} />
      <StatCard label="New" value={stats.new} icon={Sparkles} tone="info" />
      <StatCard
        label="Reviewing"
        value={stats.reviewing}
        icon={ClipboardList}
        tone="warning"
      />
      <StatCard
        label="Shortlisted"
        value={stats.shortlisted}
        icon={Heart}
        tone="success"
      />
      <StatCard
        label="Interviews"
        value={stats.interview}
        icon={CalendarDays}
        tone="warning"
      />
    </div>
  );
}
