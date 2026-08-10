"use client";

import Link from "next/link";
import {
  ExternalLink,
  MapPin,
  MessageSquare,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ApplicantAvatar } from "@/features/employer-applicants/components/ApplicantAvatar";
import { EMPLOYER_APPLICANT_ROUTES } from "@/features/employer-applicants/constants";
import { formatExperienceYears } from "@/features/employer-applicants/lib/format";
import { EMPLOYER_ROUTES } from "@/features/employer-company/constants";
import { EMPLOYER_INTERVIEW_ROUTES } from "../constants";
import {
  formatInterviewDateLong,
  formatInterviewTime,
  formatSubmittedAt,
  getInterviewTypeLabel,
  getRecommendationLabel,
} from "../lib/format";
import type { EmployerInterview } from "../types/interview.types";
import { InterviewStatusBadge } from "./InterviewStatusBadge";
import { InterviewTimeline } from "./InterviewTimeline";

export function InterviewDetails({
  interview,
  onCancel,
  onComplete,
  onNoShow,
  onHire,
  onReject,
  onMessage,
}: {
  interview: EmployerInterview;
  onCancel: () => void;
  onComplete: () => void;
  onNoShow: () => void;
  onHire: () => void;
  onReject: () => void;
  onMessage: () => void;
}) {
  const canManage = interview.status === "scheduled";

  return (
    <div className="space-y-6">
      <header className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-text">
                Interview Details
              </h1>
              <InterviewStatusBadge status={interview.status} />
            </div>
            <p className="mt-2 text-sm text-muted">
              {formatInterviewDateLong(interview.scheduledDate)} ·{" "}
              {formatInterviewTime(interview.startTime)} –{" "}
              {formatInterviewTime(interview.endTime)} ({interview.timezone})
            </p>
            <p className="mt-1 text-sm text-muted">
              {getInterviewTypeLabel(interview.type)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canManage ? (
              <>
                <Button
                  href={EMPLOYER_INTERVIEW_ROUTES.edit(interview.id)}
                  variant="secondary"
                >
                  Edit
                </Button>
                <Button variant="secondary" onClick={onCancel}>
                  Cancel Interview
                </Button>
                <Button onClick={onComplete}>Mark Completed</Button>
                <Button variant="ghost" onClick={onNoShow}>
                  Mark No-show
                </Button>
              </>
            ) : null}
            {interview.status === "completed" && !interview.feedback ? (
              <Button href={EMPLOYER_INTERVIEW_ROUTES.feedback(interview.id)}>
                Add Feedback
              </Button>
            ) : null}
            {interview.feedback ? (
              <Button
                href={EMPLOYER_INTERVIEW_ROUTES.feedback(interview.id)}
                variant="secondary"
              >
                View Feedback
              </Button>
            ) : null}
            <Button variant="secondary" onClick={onMessage}>
              <MessageSquare size={15} aria-hidden="true" />
              Message Candidate
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-4">
          <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
            <h2 className="text-base font-semibold text-text">Candidate</h2>
            <div className="mt-4 flex gap-4">
              <ApplicantAvatar
                name={interview.candidateName}
                avatarUrl={interview.candidateAvatarUrl}
                size="lg"
              />
              <div className="min-w-0">
                <p className="text-lg font-semibold text-text">
                  {interview.candidateName}
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  {interview.candidateRole}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
                  <span>
                    {formatExperienceYears(interview.candidateExperienceYears)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} aria-hidden="true" />
                    {interview.candidateLocation}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {interview.candidateSapSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-muted"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="mt-4">
                  <Button
                    href={EMPLOYER_APPLICANT_ROUTES.details(
                      interview.applicationId,
                    )}
                    variant="secondary"
                    className="!px-3 !py-2 text-xs"
                  >
                    View Candidate
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
            <h2 className="text-base font-semibold text-text">
              Interview Information
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Type
                </dt>
                <dd className="mt-1 text-sm font-medium text-text">
                  {getInterviewTypeLabel(interview.type)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Interviewers
                </dt>
                <dd className="mt-1 text-sm font-medium text-text">
                  {interview.interviewers.map((person) => person.name).join(", ") ||
                    "—"}
                </dd>
              </div>
              {interview.type === "video" && interview.meetingLink ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Meeting Link
                  </dt>
                  <dd className="mt-2 flex flex-wrap items-center gap-2">
                    <a
                      href={interview.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-accent"
                      aria-label="Open meeting link in a new tab"
                    >
                      {interview.meetingLink}
                      <ExternalLink size={14} aria-hidden="true" />
                    </a>
                    <Button
                      href={interview.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="!px-3 !py-2 text-xs"
                    >
                      <Video size={14} aria-hidden="true" />
                      Join Interview
                    </Button>
                  </dd>
                </div>
              ) : null}
              {interview.type === "phone" && interview.phoneNumber ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Phone Number
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-text">
                    <a
                      href={`tel:${interview.phoneNumber}`}
                      className="text-primary hover:text-accent"
                      aria-label={`Call ${interview.phoneNumber}`}
                    >
                      {interview.phoneNumber}
                    </a>
                  </dd>
                </div>
              ) : null}
              {interview.type === "in_person" && interview.location ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Location
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-text">
                    {interview.location}
                  </dd>
                </div>
              ) : null}
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Notes
                </dt>
                <dd className="mt-1 text-sm text-text">
                  {interview.notes || "No notes added."}
                </dd>
              </div>
            </dl>
          </section>

          {interview.feedback ? (
            <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
              <h2 className="text-base font-semibold text-text">
                Feedback submitted
              </h2>
              <p className="mt-1 text-xs text-muted">
                {formatSubmittedAt(interview.feedback.submittedAt)}
              </p>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <dt className="text-muted">Overall Rating</dt>
                  <dd className="font-semibold text-text">
                    {interview.feedback.overallRating}/5
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Recommendation</dt>
                  <dd className="font-semibold text-text">
                    {getRecommendationLabel(interview.feedback.recommendation)}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={onHire}>Hire Candidate</Button>
                <Button variant="secondary" onClick={onReject}>
                  Reject Candidate
                </Button>
              </div>
            </section>
          ) : interview.status === "completed" ? (
            <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
              <h2 className="text-base font-semibold text-text">
                No interview feedback yet.
              </h2>
              <p className="mt-1 text-sm text-muted">
                Capture ratings and a hiring recommendation after the interview.
              </p>
              <div className="mt-4">
                <Button href={EMPLOYER_INTERVIEW_ROUTES.feedback(interview.id)}>
                  Add Feedback
                </Button>
              </div>
            </section>
          ) : null}

          <InterviewTimeline interview={interview} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
            <h2 className="text-base font-semibold text-text">Job</h2>
            <p className="mt-3 text-sm font-semibold text-text">
              {interview.jobTitle}
            </p>
            <dl className="mt-3 space-y-2 text-sm text-muted">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide">
                  SAP Module
                </dt>
                <dd className="mt-0.5 text-text">{interview.sapModule}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide">
                  Location
                </dt>
                <dd className="mt-0.5 text-text">{interview.jobLocation}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide">
                  Employment type
                </dt>
                <dd className="mt-0.5 text-text">{interview.employmentType}</dd>
              </div>
            </dl>
            <div className="mt-4">
              <Button
                href={EMPLOYER_ROUTES.jobDetails(interview.jobId)}
                variant="secondary"
                className="!px-3 !py-2 text-xs"
              >
                View Job
              </Button>
            </div>
          </section>

          <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
            <h2 className="text-base font-semibold text-text">Quick links</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href={EMPLOYER_INTERVIEW_ROUTES.list}
                  className="font-semibold text-primary hover:text-accent"
                >
                  All interviews
                </Link>
              </li>
              <li>
                <Link
                  href={EMPLOYER_APPLICANT_ROUTES.details(interview.applicationId)}
                  className="font-semibold text-primary hover:text-accent"
                >
                  Application details
                </Link>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
