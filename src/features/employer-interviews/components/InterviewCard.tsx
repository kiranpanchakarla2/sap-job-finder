"use client";

import { Button } from "@/components/ui/Button";
import { ApplicantAvatar } from "@/features/employer-applicants/components/ApplicantAvatar";
import { EMPLOYER_INTERVIEW_ROUTES } from "../constants";
import {
  formatInterviewDate,
  formatInterviewTime,
} from "../lib/format";
import type { EmployerInterview } from "../types/interview.types";
import { InterviewStatusBadge } from "./InterviewStatusBadge";
import { InterviewTypeBadge } from "./InterviewTypeBadge";

export function InterviewCard({ interview }: { interview: EmployerInterview }) {
  return (
    <article className="rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <ApplicantAvatar
          name={interview.candidateName}
          avatarUrl={interview.candidateAvatarUrl}
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-text">
            {interview.candidateName}
          </h3>
          <p className="mt-0.5 text-sm text-muted">{interview.jobTitle}</p>
        </div>
        <InterviewStatusBadge status={interview.status} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
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
        <div className="col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
            Interview type
          </dt>
          <dd className="mt-1">
            <InterviewTypeBadge type={interview.type} />
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <Button
          href={EMPLOYER_INTERVIEW_ROUTES.details(interview.id)}
          variant="secondary"
          className="!px-3 !py-2 text-xs"
        >
          View Interview
        </Button>
      </div>
    </article>
  );
}
