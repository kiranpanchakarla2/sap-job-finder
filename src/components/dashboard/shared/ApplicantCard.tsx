"use client";

import type { EmployerApplicant } from "@/types/employer";

const statusStyles: Record<string, string> = {
  New: "bg-sky-500/10 text-sky-700",
  "Under Review": "bg-amber-500/10 text-amber-700",
  Shortlisted: "bg-emerald-500/10 text-emerald-700",
  Interview: "bg-violet-500/10 text-violet-700",
  Rejected: "bg-red-500/10 text-red-700",
  Hired: "bg-primary/10 text-primary",
};

export function ApplicantCard({
  applicant,
  onView,
  onShortlist,
  onReject,
}: {
  applicant: EmployerApplicant;
  onView?: (id: string) => void;
  onShortlist?: (id: string) => void;
  onReject?: (id: string) => void;
}) {
  const initials = applicant.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-soft sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-text">{applicant.name}</h3>
              <p className="text-xs text-muted">{applicant.jobTitle}</p>
            </div>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                statusStyles[applicant.status] ?? "bg-surface text-muted"
              }`}
            >
              {applicant.status}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span>{applicant.sapModule}</span>
            <span>{applicant.experience}</span>
            <span>{applicant.location}</span>
            <span>Applied {applicant.appliedAt}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onView?.(applicant.id)}
              className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-xs font-semibold text-text transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              View Profile
            </button>
            <button
              type="button"
              onClick={() => onShortlist?.(applicant.id)}
              className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-white transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              Shortlist
            </button>
            <button
              type="button"
              onClick={() => onReject?.(applicant.id)}
              className="inline-flex h-8 items-center rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
