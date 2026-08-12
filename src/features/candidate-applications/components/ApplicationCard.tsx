"use client";

import Link from "next/link";
import { canWithdrawApplication } from "../constants";
import { formatApplicationDate } from "../lib/applicationUtils";
import type { CandidateApplication } from "../types/application.types";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

export function ApplicationCard({
  application,
  onWithdraw,
}: {
  application: CandidateApplication;
  onWithdraw?: (id: string) => void;
}) {
  const canWithdraw = canWithdrawApplication(application.status);

  return (
    <article className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-text">{application.job.title}</h3>
          <p className="mt-0.5 text-sm text-muted">{application.job.companyName}</p>
          <p className="mt-2 text-xs text-muted">
            {application.job.location} · {application.job.workMode}
          </p>
          <p className="mt-1 text-xs text-muted">
            Applied {formatApplicationDate(application.appliedAt)}
          </p>
          <p className="mt-2 text-xs text-muted">
            Resume: <span className="font-medium text-text">{application.resume.label}</span>
          </p>
        </div>
        <ApplicationStatusBadge status={application.status} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/candidate/applications/${application.id}`}
          className="inline-flex h-9 items-center justify-center rounded-[var(--radius-button)] bg-primary px-4 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          View Application
        </Link>
        {canWithdraw && onWithdraw ? (
          <button
            type="button"
            onClick={() => onWithdraw(application.id)}
            className="inline-flex h-9 items-center justify-center rounded-[var(--radius-button)] border border-border px-4 text-xs font-semibold text-muted hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            Withdraw
          </button>
        ) : null}
      </div>
    </article>
  );
}
