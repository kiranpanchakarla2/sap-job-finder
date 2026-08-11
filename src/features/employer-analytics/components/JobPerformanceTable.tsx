"use client";

import {
  StatusBadge,
  jobStatusTone,
} from "@/components/dashboard/shared/StatusBadge";
import { formatRate } from "../lib/calculations";
import type { JobPerformanceRow } from "../types/analytics.types";

export function JobPerformanceTable({ rows }: { rows: JobPerformanceRow[] }) {
  if (!rows.length) {
    return (
      <p className="text-sm text-muted">No job performance data for this period.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <th className="px-3 py-3 font-semibold">Job</th>
            <th className="px-3 py-3 font-semibold">Status</th>
            <th className="px-3 py-3 font-semibold">Applications</th>
            <th className="px-3 py-3 font-semibold">Shortlisted</th>
            <th className="px-3 py-3 font-semibold">Interviews</th>
            <th className="px-3 py-3 font-semibold">Hires</th>
            <th className="px-3 py-3 font-semibold">Hire Rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.jobId} className="border-b border-border/70 last:border-0">
              <td className="px-3 py-3.5 font-medium text-text">{row.title}</td>
              <td className="px-3 py-3.5">
                <StatusBadge tone={jobStatusTone(row.status)}>{row.status}</StatusBadge>
              </td>
              <td className="px-3 py-3.5 text-muted">{row.applications}</td>
              <td className="px-3 py-3.5 text-muted">{row.shortlisted}</td>
              <td className="px-3 py-3.5 text-muted">{row.interviews}</td>
              <td className="px-3 py-3.5 text-muted">{row.hires}</td>
              <td className="px-3 py-3.5 text-muted">{formatRate(row.hireRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
