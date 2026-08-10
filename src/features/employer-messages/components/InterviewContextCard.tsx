"use client";

import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EMPLOYER_INTERVIEW_ROUTES } from "@/features/employer-interviews/constants";
import {
  formatInterviewDate,
  formatInterviewTime,
  getInterviewTypeLabel,
} from "@/features/employer-interviews/lib/format";
import type { EmployerInterview } from "@/features/employer-interviews/types/interview.types";

export function InterviewContextCard({
  interview,
}: {
  interview: EmployerInterview;
}) {
  return (
    <div className="mx-4 mt-4 rounded-[var(--radius-control)] border border-border bg-surface/60 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            <CalendarDays size={12} aria-hidden="true" />
            Upcoming Interview
          </p>
          <p className="mt-1 text-sm font-semibold text-text">
            {formatInterviewDate(interview.scheduledDate)} ·{" "}
            {formatInterviewTime(interview.startTime)}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {getInterviewTypeLabel(interview.type)}
          </p>
        </div>
        <Button
          href={EMPLOYER_INTERVIEW_ROUTES.details(interview.id)}
          variant="secondary"
          className="!px-3 !py-2 text-xs"
        >
          View Interview
        </Button>
      </div>
    </div>
  );
}
