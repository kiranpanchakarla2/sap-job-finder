"use client";

import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EMPLOYER_INTERVIEW_ROUTES } from "@/features/employer-interviews/constants";
import { EMPLOYER_APPLICANT_ROUTES } from "../constants";
import { formatApplicationDate, formatExperienceYears } from "../lib/format";
import type {
  ApplicationAction,
  EmployerApplication,
} from "../types/application.types";
import { ApplicantActions } from "./ApplicantActions";
import { ApplicantAvatar } from "./ApplicantAvatar";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

export function ApplicantCard({
  application,
  onAction,
  showScheduleInterview = false,
}: {
  application: EmployerApplication;
  onAction: (action: ApplicationAction, application: EmployerApplication) => void;
  showScheduleInterview?: boolean;
}) {
  return (
    <article className="rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <ApplicantAvatar
            name={application.candidateName}
            avatarUrl={application.avatarUrl}
          />
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-text">
              {application.candidateName}
            </h3>
            <p className="mt-0.5 text-sm text-muted">{application.currentRole}</p>
          </div>
        </div>
        <ApplicantActions
          status={application.status}
          onAction={(action) => onAction(action, application)}
        />
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
            Applied job
          </dt>
          <dd className="mt-0.5 font-medium text-text">
            {application.appliedJobTitle}
          </dd>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span>{formatExperienceYears(application.experienceYears)}</span>
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} aria-hidden="true" />
            {application.location}
          </span>
          <span>{formatApplicationDate(application.applicationDate)}</span>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {application.sapSkills.slice(0, 3).map((skill) => (
          <span
            key={skill}
            className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-muted"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ApplicationStatusBadge status={application.status} />
        <Button
          variant="secondary"
          className="!px-3 !py-2 text-xs"
          href={EMPLOYER_APPLICANT_ROUTES.details(application.id)}
        >
          View Application
        </Button>
        {showScheduleInterview && application.status === "shortlisted" ? (
          <Button
            className="!px-3 !py-2 text-xs"
            href={EMPLOYER_INTERVIEW_ROUTES.scheduleWithApplication(
              application.id,
            )}
          >
            Schedule Interview
          </Button>
        ) : null}
      </div>
    </article>
  );
}
