"use client";

import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EMPLOYER_INTERVIEW_ROUTES } from "@/features/employer-interviews/constants";
import {
  formatInterviewDate,
  formatInterviewTime,
  getInterviewTypeLabel,
} from "@/features/employer-interviews/lib/format";
import { useApplicationInterview } from "@/features/employer-interviews";
import { InterviewStatusBadge } from "@/features/employer-interviews/components/InterviewStatusBadge";
import type { ApplicationStatus } from "../types/application.types";

export function ApplicantInterviewPanel({
  applicationId,
  status,
}: {
  applicationId: string;
  status: ApplicationStatus;
}) {
  const { interview, allInterviews, isLoading } =
    useApplicationInterview(applicationId);

  if (isLoading) {
    return (
      <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
        <h2 className="text-base font-semibold text-text">Interview</h2>
        <p className="mt-2 text-sm text-muted">Loading interview details…</p>
      </section>
    );
  }

  const hasUpcoming =
    interview &&
    interview.status === "scheduled" &&
    interview.applicationId === applicationId;

  if (hasUpcoming) {
    return (
      <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-primary" aria-hidden="true" />
          <h2 className="text-base font-semibold text-text">Upcoming Interview</h2>
        </div>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Date
            </dt>
            <dd className="mt-0.5 font-medium text-text">
              {formatInterviewDate(interview.scheduledDate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Time
            </dt>
            <dd className="mt-0.5 font-medium text-text">
              {formatInterviewTime(interview.startTime)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Type
            </dt>
            <dd className="mt-0.5 font-medium text-text">
              {getInterviewTypeLabel(interview.type)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Status
            </dt>
            <dd className="mt-1">
              <InterviewStatusBadge status={interview.status} />
            </dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            href={EMPLOYER_INTERVIEW_ROUTES.details(interview.id)}
            variant="secondary"
            className="!px-3 !py-2 text-xs"
          >
            View Interview
          </Button>
          {allInterviews.length > 1 ? (
            <Button
              href={EMPLOYER_INTERVIEW_ROUTES.list}
              variant="ghost"
              className="!px-3 !py-2 text-xs"
            >
              View all interviews
            </Button>
          ) : null}
        </div>
      </section>
    );
  }

  if (status === "shortlisted") {
    return (
      <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
        <h2 className="text-base font-semibold text-text">Interview</h2>
        <p className="mt-2 text-sm text-muted">
          This candidate is shortlisted. Schedule an interview to continue.
        </p>
        <div className="mt-4">
          <Button
            href={EMPLOYER_INTERVIEW_ROUTES.scheduleWithApplication(applicationId)}
          >
            Schedule Interview
          </Button>
        </div>
      </section>
    );
  }

  if (status === "interview") {
    return (
      <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
        <h2 className="text-base font-semibold text-text">Interview Scheduled</h2>
        <p className="mt-2 text-sm text-muted">
          An interview is associated with this application.
        </p>
        {interview ? (
          <div className="mt-4">
            <Button
              href={EMPLOYER_INTERVIEW_ROUTES.details(interview.id)}
              variant="secondary"
              className="!px-3 !py-2 text-xs"
            >
              View Interview
            </Button>
          </div>
        ) : (
          <div className="mt-4">
            <Button
              href={EMPLOYER_INTERVIEW_ROUTES.scheduleWithApplication(applicationId)}
              variant="secondary"
            >
              Schedule Interview
            </Button>
          </div>
        )}
      </section>
    );
  }

  if (status === "hired") {
    return (
      <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
        <h2 className="text-base font-semibold text-text">Hired</h2>
        <p className="mt-2 text-sm text-muted">
          This candidate has been hired.
        </p>
      </section>
    );
  }

  if (status === "rejected") {
    return (
      <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
        <h2 className="text-base font-semibold text-text">Rejected</h2>
        <p className="mt-2 text-sm text-muted">
          This application was rejected.
        </p>
      </section>
    );
  }

  return null;
}
