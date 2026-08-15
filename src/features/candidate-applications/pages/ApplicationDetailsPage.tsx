"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/features/candidate-resume/components/ConfirmDialog";
import { canWithdrawApplication } from "../constants";
import { useApplications } from "../context/ApplicationsProvider";
import { formatApplicationDate } from "../lib/applicationUtils";
import { candidateApplicationService } from "../services/candidateApplicationService";
import type { CandidateApplication } from "../types/application.types";
import { ApplicationStatusBadge } from "../components/ApplicationStatusBadge";
import { ApplicationTimeline } from "../components/ApplicationTimeline";

export function ApplicationDetailsPage() {
  const params = useParams<{ applicationId: string }>();
  const { getApplicationById, withdrawApplication, hydrated } = useApplications();
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [directApplication, setDirectApplication] = useState<CandidateApplication | null>(null);
  const [loadingDirect, setLoadingDirect] = useState(false);

  const contextApplication = getApplicationById(params.applicationId);

  useEffect(() => {
    if (!contextApplication && params.applicationId && hydrated) {
      let cancelled = false;
      setLoadingDirect(true);
      void candidateApplicationService.getCandidateApplication(params.applicationId).then((res) => {
        if (!cancelled && res.success) {
          setDirectApplication(res.data);
        }
        if (!cancelled) setLoadingDirect(false);
      });
      return () => {
        cancelled = true;
      };
    }
  }, [contextApplication, params.applicationId, hydrated]);

  const application = contextApplication ?? directApplication;

  if (!hydrated || loadingDirect) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse space-y-4">
        <div className="h-8 w-64 rounded bg-surface" />
        <div className="h-40 rounded-[var(--radius-card)] bg-surface" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="mx-auto max-w-3xl rounded-[var(--radius-card)] border border-dashed border-border bg-card px-6 py-16 text-center shadow-soft">
        <h1 className="text-xl font-bold text-text">Application not found</h1>
        <p className="mt-2 text-sm text-muted">
          This application may no longer be available.
        </p>
        <Button href="/candidate/applications" className="mt-6">
          Back to Applications
        </Button>
      </div>
    );
  }

  const canWithdraw = canWithdrawApplication(application.status);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/candidate/applications" className="text-sm font-medium text-primary">
          ← My Applications
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-text">
          Application Details
        </h1>
      </div>

      <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text">{application.job.title}</h2>
            <p className="mt-1 text-sm text-muted">{application.job.companyName}</p>
            <p className="mt-2 text-sm text-muted">
              {application.job.location} · {application.job.workMode} ·{" "}
              {application.job.employmentType}
            </p>
            <p className="mt-1 text-xs text-muted">
              Applied {formatApplicationDate(application.appliedAt)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Current Status
            </p>
            <div className="mt-1 flex justify-end">
              <ApplicationStatusBadge status={application.status} />
            </div>
            <p className="mt-2 text-xs text-muted">
              Last updated {formatApplicationDate(application.updatedAt)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button href={`/candidate/jobs/${application.jobId}`} variant="secondary" className="!h-9 text-xs">
            View Job
          </Button>
          <Button href="/candidate/resume" variant="secondary" className="!h-9 text-xs">
            View Resume
          </Button>
          {canWithdraw ? (
            <button
              type="button"
              onClick={() => setConfirmWithdraw(true)}
              className="inline-flex h-9 items-center justify-center rounded-[var(--radius-button)] border border-border px-4 text-xs font-semibold text-muted hover:text-error"
            >
              Withdraw Application
            </button>
          ) : application.status === "withdrawn" ? (
            <span className="inline-flex h-9 items-center text-xs font-semibold text-muted">
              Application Withdrawn
            </span>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
          <h3 className="text-sm font-semibold text-text">Submitted Data</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                Resume submitted
              </dt>
              <dd className="mt-0.5 font-medium text-text">{application.resume.label}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                Cover Letter
              </dt>
              <dd className="mt-0.5 text-muted">
                {application.coverLetter.trim() ? "Available" : "Not provided"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                Questions
              </dt>
              <dd className="mt-0.5 text-muted">
                {application.answers.length} answered
              </dd>
            </div>
          </dl>

          {application.coverLetter.trim() ? (
            <div className="mt-4 rounded-xl border border-border bg-surface/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Cover letter
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
                {application.coverLetter}
              </p>
            </div>
          ) : null}
        </section>

        <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
          <h3 className="mb-4 text-sm font-semibold text-text">Application Timeline</h3>
          <ApplicationTimeline events={application.timeline} />
        </section>
      </div>

      <ConfirmDialog
        open={confirmWithdraw}
        title="Withdraw application?"
        description={`Are you sure you want to withdraw your application for ${application.job.title}? This action cannot be undone.`}
        confirmLabel="Withdraw Application"
        cancelLabel="Keep Application"
        tone="danger"
        onCancel={() => setConfirmWithdraw(false)}
        onConfirm={() => {
          withdrawApplication(application.id);
          setConfirmWithdraw(false);
        }}
      />
    </div>
  );
}
