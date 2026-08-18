"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { DiscoveryJob } from "@/features/candidate-jobs/types/job.types";
import { useAuth } from "@/auth/AuthContext";
import { formatApplicationDate } from "../lib/applicationUtils";
import type {
  ApplicationDraft,
  JobApplicationRequirements,
  SelectableResume,
} from "../types/application.types";

export function ApplicationReview({
  job,
  draft,
  requirements,
  resumes,
  onEditStep,
}: {
  job: DiscoveryJob;
  draft: ApplicationDraft;
  requirements: JobApplicationRequirements;
  resumes: SelectableResume[];
  onEditStep: (step: ApplicationDraft["currentStep"]) => void;
}) {
  const { user, profile } = useAuth();
  const resume = resumes.find((item) => item.id === draft.resumeId);
  const fullName = profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() : "";
  const candidateName = fullName || user?.name || "Candidate";
  const candidateEmail = user?.email || "";
  const answeredCount = requirements.questions.filter((q) => {
    const value = draft.answers[q.id];
    if (value == null || value === "") return false;
    if (Array.isArray(value) && !value.length) return false;
    return true;
  }).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text">Review Your Application</h2>
        <p className="mt-1 text-sm text-muted">
          Confirm everything looks right before submitting to {job.companyName}.
        </p>
      </div>

      <ReviewSection title="Job" onEdit={() => onEditStep("details")}>
        <p className="font-medium text-text">{job.title}</p>
        <p className="text-sm text-muted">
          {job.companyName} · {job.location} · {job.workMode}
        </p>
      </ReviewSection>

      <ReviewSection title="Resume" onEdit={() => onEditStep("resume")} editLabel="Change">
        {resume ? (
          <>
            <p className="font-medium text-text">{resume.label}</p>
            <p className="text-sm text-muted">
              Updated {formatApplicationDate(resume.updatedAt)} · {resume.fileName}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">No resume selected</p>
        )}
      </ReviewSection>

      <ReviewSection title="Cover Letter" onEdit={() => onEditStep("coverLetter")}>
        {draft.coverLetter.trim() ? (
          <p className="whitespace-pre-wrap text-sm text-muted">{draft.coverLetter}</p>
        ) : (
          <p className="text-sm text-muted">No cover letter provided</p>
        )}
      </ReviewSection>

      <ReviewSection title="Questions" onEdit={() => onEditStep("questions")}>
        <p className="text-sm text-muted">
          {answeredCount} of {requirements.questions.length} questions answered
        </p>
      </ReviewSection>

      <ReviewSection title="Candidate Profile" editHref="/candidate/profile" editLabel="Edit Profile">
        <p className="font-medium text-text">{candidateName}</p>
        <p className="text-sm text-muted">
          {candidateEmail}
          {profile?.phone ? ` · ${profile.phone}` : ""}
        </p>
        <p className="mt-1 text-xs text-muted">
          Your profile details and uploaded resume will be shared with {job.companyName}.
        </p>
      </ReviewSection>

      <div className="rounded-[var(--radius-card)] border border-primary/20 bg-primary/5 p-4">
        <h3 className="text-base font-semibold text-text">Ready to submit?</h3>
        <p className="mt-1 text-sm text-muted">
          Once submitted, your application will be sent to <strong>{job.companyName}</strong> for{" "}
          <strong>{job.title}</strong>.
        </p>
      </div>
    </div>
  );
}

function ReviewSection({
  title,
  children,
  onEdit,
  editHref,
  editLabel = "Edit",
}: {
  title: string;
  children: ReactNode;
  onEdit?: () => void;
  editHref?: string;
  editLabel?: string;
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-soft">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        {editHref ? (
          <Link href={editHref} className="text-xs font-semibold text-primary hover:text-accent">
            {editLabel}
          </Link>
        ) : onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="text-xs font-semibold text-primary hover:text-accent"
          >
            {editLabel}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}
