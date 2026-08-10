"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ApplicantAvatar } from "@/features/employer-applicants/components/ApplicantAvatar";
import { EMPLOYER_INTERVIEW_ROUTES } from "../constants";
import { formatInterviewDateTime } from "../lib/format";
import type { EmployerInterview } from "../types/interview.types";
import { InterviewStatusBadge } from "./InterviewStatusBadge";
import { InterviewTypeBadge } from "./InterviewTypeBadge";

export function InterviewTable({
  interviews,
}: {
  interviews: EmployerInterview[];
}) {
  return (
    <div className="hidden overflow-hidden rounded-[var(--radius-card)] border border-border bg-card shadow-soft md:block">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface/60 text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3 font-semibold">Candidate</th>
            <th className="px-4 py-3 font-semibold">Job</th>
            <th className="px-4 py-3 font-semibold">Date &amp; Time</th>
            <th className="px-4 py-3 font-semibold">Interview Type</th>
            <th className="px-4 py-3 font-semibold">Interviewer</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {interviews.map((interview) => (
            <tr
              key={interview.id}
              className="border-b border-border/70 last:border-0"
            >
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <ApplicantAvatar
                    name={interview.candidateName}
                    avatarUrl={interview.candidateAvatarUrl}
                    size="sm"
                  />
                  <Link
                    href={EMPLOYER_INTERVIEW_ROUTES.details(interview.id)}
                    className="font-semibold text-text hover:text-primary"
                  >
                    {interview.candidateName}
                  </Link>
                </div>
              </td>
              <td className="px-4 py-4">
                <p className="font-medium text-text">{interview.jobTitle}</p>
                <p className="mt-0.5 text-xs text-muted">{interview.sapModule}</p>
              </td>
              <td className="px-4 py-4 text-muted">
                {formatInterviewDateTime(
                  interview.scheduledDate,
                  interview.startTime,
                )}
              </td>
              <td className="px-4 py-4">
                <InterviewTypeBadge type={interview.type} />
              </td>
              <td className="px-4 py-4 text-muted">
                {interview.interviewers.map((person) => person.name).join(", ") ||
                  "—"}
              </td>
              <td className="px-4 py-4">
                <InterviewStatusBadge status={interview.status} />
              </td>
              <td className="px-4 py-4 text-right">
                <Button
                  href={EMPLOYER_INTERVIEW_ROUTES.details(interview.id)}
                  variant="ghost"
                  className="!px-3 !py-2 text-xs"
                >
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
