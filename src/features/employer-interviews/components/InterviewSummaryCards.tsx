import {
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CalendarX2,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import type { InterviewSummaryStats } from "../types/interview.types";

export function InterviewSummaryCards({
  stats,
}: {
  stats: InterviewSummaryStats;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Upcoming"
        value={stats.upcoming}
        icon={CalendarClock}
        tone="info"
      />
      <StatCard
        label="Today"
        value={stats.today}
        icon={CalendarDays}
        tone="warning"
      />
      <StatCard
        label="Completed"
        value={stats.completed}
        icon={CalendarCheck2}
        tone="success"
      />
      <StatCard
        label="Cancelled"
        value={stats.cancelled}
        icon={CalendarX2}
      />
    </div>
  );
}
