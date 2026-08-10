import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EMPLOYER_ROUTES } from "@/features/employer-company/constants";
import type { EmployerInterviewSummary } from "../types/dashboard.types";

export function UpcomingInterviews({
  interviews,
}: {
  interviews: EmployerInterviewSummary[];
}) {
  if (!interviews.length) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No interviews scheduled"
        description="When you schedule interviews, they will show up here."
        action={<Button href={EMPLOYER_ROUTES.interviews}>View Interviews</Button>}
      />
    );
  }

  return (
    <ul className="space-y-3">
      {interviews.map((interview) => (
        <li
          key={interview.id}
          className="rounded-2xl border border-border bg-surface/40 p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-text">{interview.candidate}</p>
              <p className="mt-0.5 text-xs text-muted">{interview.job}</p>
              <p className="mt-2 text-xs text-muted">
                {interview.date} · {interview.time}
              </p>
            </div>
            <StatusBadge tone="info">{interview.type}</StatusBadge>
          </div>
          <Link
            href={EMPLOYER_ROUTES.interviews}
            className="mt-3 inline-flex text-xs font-semibold text-primary hover:text-accent"
          >
            View Interview
          </Link>
        </li>
      ))}
    </ul>
  );
}
