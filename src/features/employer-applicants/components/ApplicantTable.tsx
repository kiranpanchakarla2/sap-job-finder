"use client";

import Link from "next/link";
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

export function ApplicantTable({
  applications,
  onAction,
  showScheduleInterview = false,
}: {
  applications: EmployerApplication[];
  onAction: (action: ApplicationAction, application: EmployerApplication) => void;
  showScheduleInterview?: boolean;
}) {
  return (
    <div className="hidden overflow-hidden rounded-[var(--radius-card)] border border-border bg-card shadow-soft md:block">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface/60 text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3 font-semibold">Candidate</th>
            <th className="px-4 py-3 font-semibold">Applied For</th>
            <th className="px-4 py-3 font-semibold">Experience</th>
            <th className="px-4 py-3 font-semibold">SAP Skills</th>
            <th className="px-4 py-3 font-semibold">Applied Date</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => (
            <tr
              key={application.id}
              className="border-b border-border/70 last:border-0"
            >
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <ApplicantAvatar
                    name={application.candidateName}
                    avatarUrl={application.avatarUrl}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <Link
                      href={EMPLOYER_APPLICANT_ROUTES.details(application.id)}
                      className="font-semibold text-text hover:text-primary"
                    >
                      {application.candidateName}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {application.email}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                <p className="font-medium text-text">{application.appliedJobTitle}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {application.sapModule} · {application.jobLocation}
                </p>
              </td>
              <td className="px-4 py-4 text-muted">
                {formatExperienceYears(application.experienceYears)}
              </td>
              <td className="px-4 py-4 text-muted">
                {application.sapSkills.slice(0, 3).join(", ")}
              </td>
              <td className="px-4 py-4 text-muted">
                {formatApplicationDate(application.applicationDate)}
              </td>
              <td className="px-4 py-4">
                <ApplicationStatusBadge status={application.status} />
              </td>
              <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  {showScheduleInterview &&
                  application.status === "shortlisted" ? (
                    <Button
                      href={EMPLOYER_INTERVIEW_ROUTES.scheduleWithApplication(
                        application.id,
                      )}
                      className="!px-3 !py-2 text-xs"
                    >
                      Schedule Interview
                    </Button>
                  ) : null}
                  <ApplicantActions
                    status={application.status}
                    onAction={(action) => onAction(action, application)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
