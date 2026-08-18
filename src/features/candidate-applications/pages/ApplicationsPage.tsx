"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { ConfirmDialog } from "@/features/candidate-resume/components/ConfirmDialog";
import {
  APPLICATION_STATUS_CONFIG,
  STATUS_FILTER_OPTIONS,
} from "../constants";
import { useApplications } from "../context/ApplicationsProvider";
import {
  computeApplicationStats,
  filterApplications,
  formatApplicationDate,
} from "../lib/applicationUtils";
import type { ApplicationListFilters, ApplicationStatus } from "../types/application.types";
import { DEFAULT_APPLICATION_FILTERS } from "../types/application.types";
import { ApplicationCard } from "../components/ApplicationCard";

export function ApplicationsPage() {
  const { applications, drafts, deleteDraft, withdrawApplication, hydrated } =
    useApplications();
  const [filters, setFilters] = useState<ApplicationListFilters>(DEFAULT_APPLICATION_FILTERS);
  const [withdrawId, setWithdrawId] = useState<string | null>(null);
  const [deleteDraftJobId, setDeleteDraftJobId] = useState<string | null>(null);

  const filtered = useMemo(
    () => filterApplications(applications, filters),
    [applications, filters],
  );
  const stats = useMemo(() => computeApplicationStats(applications), [applications]);

  const locations = useMemo(() => {
    return [...new Set(applications.map((app) => app.job.location.split(",")[0]?.trim() || ""))]
      .filter(Boolean)
      .sort();
  }, [applications]);

  const jobTypes = useMemo(() => {
    return [...new Set(applications.map((app) => app.job.employmentType).filter(Boolean))].sort();
  }, [applications]);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-7xl w-full animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-surface" />
        <div className="grid gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-[var(--radius-card)] bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl w-full space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
          My Applications
        </h1>
        <p className="mt-1 text-sm text-muted">
          Track the jobs you&apos;ve applied to and follow your application progress.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total Applications" value={stats.total} />
        <Stat label="Under Review" value={stats.underReview} />
        <Stat label="Interviews" value={stats.interviews} />
        <Stat label="Offers" value={stats.offers} />
      </div>

      {drafts.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-text">Draft Applications</h2>
          <div className="grid gap-3">
            {drafts.map((draft) => {
              const matchedApp = applications.find((a) => a.jobId === draft.jobId);
              return (
              <div
                key={draft.jobId}
                className="rounded-[var(--radius-card)] border border-dashed border-border bg-card p-4 shadow-soft"
              >
                <p className="font-semibold text-text">
                  {matchedApp?.job.title ?? "Job Application in Progress"}
                </p>
                {matchedApp?.job.companyName ? (
                  <p className="mt-0.5 text-sm text-muted">{matchedApp.job.companyName}</p>
                ) : null}
                <p className="mt-1 text-xs text-muted">
                  {draft.resumeId ? "Resume selected" : "Resume pending"}
                  {draft.coverLetter.trim() ? " · Cover letter started" : ""}
                  {" · "}
                  Last saved {formatApplicationDate(draft.lastSavedAt)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button href={`/candidate/jobs/${draft.jobId}/apply`} className="!h-9 px-4 text-xs">
                    Continue Application
                  </Button>
                  <button
                    type="button"
                    onClick={() => setDeleteDraftJobId(draft.jobId)}
                    className="inline-flex h-9 items-center rounded-[var(--radius-button)] border border-border px-4 text-xs font-semibold text-muted hover:text-error"
                  >
                    Delete Draft
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="grid gap-3 rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-soft md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <label className="text-xs font-semibold text-muted">
            Search
            <input
              value={filters.query}
              onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
              placeholder="Job title, company, location"
              className="mt-1.5 w-full rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="text-xs font-semibold text-muted">
            Status
            <NativeSelect
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value as ApplicationStatus | "all",
                }))
              }
              className="mt-1.5 rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 text-sm"
            >
              {STATUS_FILTER_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All" : APPLICATION_STATUS_CONFIG[status].label}
                </option>
              ))}
            </NativeSelect>
          </label>
          <label className="text-xs font-semibold text-muted">
            Date Applied
            <NativeSelect
              value={filters.dateApplied}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  dateApplied: e.target.value as ApplicationListFilters["dateApplied"],
                }))
              }
              className="mt-1.5 rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="all">All time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </NativeSelect>
          </label>
          <label className="text-xs font-semibold text-muted">
            Job Type
            <NativeSelect
              value={filters.jobType}
              onChange={(e) => setFilters((prev) => ({ ...prev, jobType: e.target.value }))}
              className="mt-1.5 rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="">All types</option>
              {jobTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </NativeSelect>
          </label>
          <label className="text-xs font-semibold text-muted">
            Location
            <NativeSelect
              value={filters.location}
              onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
              className="mt-1.5 rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="">All locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </NativeSelect>
          </label>
          <label className="text-xs font-semibold text-muted">
            Sort by
            <NativeSelect
              value={filters.sort}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sort: e.target.value as ApplicationListFilters["sort"],
                }))
              }
              className="mt-1.5 rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 text-sm"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest</option>
              <option value="status">Status</option>
            </NativeSelect>
          </label>
        </div>

        {filtered.length ? (
          <div className="grid gap-4">
            {filtered.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                onWithdraw={setWithdrawId}
              />
            ))}
          </div>
        ) : applications.length ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-card px-6 py-12 text-center">
            <p className="font-semibold text-text">No applications match your filters</p>
            <button
              type="button"
              className="mt-3 text-sm font-semibold text-primary"
              onClick={() => setFilters(DEFAULT_APPLICATION_FILTERS)}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-card px-6 py-16 text-center shadow-soft">
            <h2 className="text-base font-semibold text-text">No applications yet</h2>
            <p className="mt-1 text-sm text-muted">
              Once you apply for a job, you can track your application status here.
            </p>
            <Button href="/candidate/jobs" className="mt-5 !h-10">
              Find SAP Jobs
            </Button>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(withdrawId)}
        title="Withdraw application?"
        description="Are you sure you want to withdraw this application? This action cannot be undone."
        confirmLabel="Withdraw Application"
        cancelLabel="Keep Application"
        tone="danger"
        onCancel={() => setWithdrawId(null)}
        onConfirm={() => {
          if (withdrawId) withdrawApplication(withdrawId);
          setWithdrawId(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteDraftJobId)}
        title="Delete draft?"
        description="This will remove your saved draft application."
        confirmLabel="Delete Draft"
        cancelLabel="Keep Draft"
        tone="danger"
        onCancel={() => setDeleteDraftJobId(null)}
        onConfirm={() => {
          if (deleteDraftJobId) deleteDraft(deleteDraftJobId);
          setDeleteDraftJobId(null);
        }}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-text">{value}</p>
    </div>
  );
}
