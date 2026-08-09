"use client";

import Link from "next/link";
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  PlusCircle,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";
import { ApplicantCard } from "@/components/dashboard/shared/ApplicantCard";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import {
  employerApplicants,
  employerDashboardStats,
  employerJobs,
  hiringOverview,
} from "@/data/mockData";

export function EmployerDashboard() {
  const { user } = useAuth();
  const companyName = user?.companyName || user?.name || "Employer";
  const maxApps = Math.max(...hiringOverview.map((d) => d.applications), 1);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Welcome, {companyName}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Here&apos;s what&apos;s happening with your hiring.
          </p>
        </div>
        <Link
          href="/employer/post-job"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-soft transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          <PlusCircle size={16} aria-hidden="true" />
          Post a New Job
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Active Jobs"
          value={employerDashboardStats.activeJobs}
          icon={Briefcase}
        />
        <StatCard
          label="Total Applications"
          value={employerDashboardStats.totalApplications}
          icon={Users}
          tone="info"
        />
        <StatCard
          label="Shortlisted"
          value={employerDashboardStats.shortlisted}
          icon={UserCheck}
          tone="success"
        />
        <StatCard
          label="Interviews"
          value={employerDashboardStats.interviews}
          icon={CalendarDays}
          tone="warning"
        />
        <StatCard
          label="Hired"
          value={employerDashboardStats.hired}
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft xl:col-span-1">
          <h2 className="text-lg font-semibold text-text">Hiring Overview</h2>
          <p className="mt-1 text-xs text-muted">Applications this week</p>
          <div className="mt-6 flex h-40 items-end gap-2">
            {hiringOverview.map((day) => (
              <div key={day.label} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-primary to-accent/80"
                  style={{ height: `${Math.max(12, (day.applications / maxApps) * 100)}%` }}
                  title={`${day.applications} applications`}
                />
                <span className="text-[10px] font-medium text-muted">{day.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-text">Recent Applicants</h2>
            <Link
              href="/employer/applicants"
              className="text-sm font-semibold text-primary hover:text-accent"
            >
              View all
            </Link>
          </div>
          {employerApplicants.length ? (
            <div className="space-y-3">
              {employerApplicants.slice(0, 3).map((applicant) => (
                <ApplicantCard
                  key={applicant.id}
                  applicant={applicant}
                  onView={() => toast.message("Profile view will connect to the API soon")}
                  onShortlist={() => toast.success(`${applicant.name} shortlisted`)}
                  onReject={() => toast.message(`${applicant.name} rejected`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No applicants yet"
              description="Post a job to start receiving SAP candidate applications."
            />
          )}
        </section>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-text">Recent Jobs</h2>
          <Link
            href="/employer/jobs"
            className="text-sm font-semibold text-primary hover:text-accent"
          >
            Manage all
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {employerJobs.map((job) => (
            <article
              key={job.id}
              className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-text">{job.title}</h3>
                  <p className="mt-0.5 text-xs text-muted">
                    {job.sapModule} · {job.location}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    job.status === "Active"
                      ? "bg-emerald-500/10 text-emerald-700"
                      : job.status === "Paused"
                        ? "bg-amber-500/10 text-amber-700"
                        : "bg-surface text-muted"
                  }`}
                >
                  {job.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                <span>{job.applications} applications</span>
                <span>{job.views} views</span>
                <span>Posted {job.postedAt}</span>
              </div>
              <Link
                href="/employer/jobs"
                className="mt-4 inline-flex h-9 items-center rounded-xl border border-border px-3.5 text-sm font-semibold text-text transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              >
                Manage Job
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
