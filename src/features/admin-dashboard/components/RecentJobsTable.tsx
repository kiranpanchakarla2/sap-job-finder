"use client";

/**
 * RecentJobsTable Component
 * Shows recent job postings preview table.
 */

import Link from "next/link";
import { ArrowUpRight, Briefcase } from "lucide-react";
import type { RecentJobItem } from "../types/dashboard.types";

type RecentJobsTableProps = {
  jobs: RecentJobItem[];
  loading?: boolean;
  error?: string | null;
};

export function RecentJobsTable({
  jobs,
  loading = false,
  error = null,
}: RecentJobsTableProps) {
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-card shadow-soft overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between p-5 border-b border-border bg-surface/30">
        <div className="flex items-center gap-2">
          <Briefcase size={18} className="text-violet-500" />
          <h3 className="text-base font-semibold text-text">Recent Jobs</h3>
        </div>
        <Link
          href="/admin/jobs"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:text-primary/80"
        >
          <span>View All</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="flex-1 overflow-x-auto">
        {loading ? (
          <div className="p-5 space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 rounded bg-surface/60 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-500">
            Unable to load recent jobs.
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center">
            <Briefcase size={24} className="mx-auto text-muted/60 mb-2" />
            <p className="text-sm font-medium text-text">
              No jobs have been posted yet.
            </p>
            <p className="text-xs text-muted mt-0.5">
              Jobs posted by employers will appear here.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-surface/50 text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-border">
              <tr>
                <th scope="col" className="px-5 py-3">
                  Job & Company
                </th>
                <th scope="col" className="px-4 py-3">
                  SAP Module
                </th>
                <th scope="col" className="px-4 py-3">
                  Location
                </th>
                <th scope="col" className="px-4 py-3">
                  Posted
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {jobs.map((job) => (
                <tr key={job.id} className="transition hover:bg-surface/40">
                  <td className="px-5 py-3">
                    <div className="font-medium text-text">{job.title}</div>
                    <div className="text-[11px] text-muted">
                      {job.companyName}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400 border border-violet-500/20">
                      {job.sapModule}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{job.location}</td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(job.postedDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold border ${
                        job.status === "active"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-surface text-muted border-border"
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
