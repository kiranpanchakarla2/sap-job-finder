"use client";

/**
 * RecentCandidatesTable Component
 * Shows recent candidate registrations preview table.
 */

import Link from "next/link";
import { ArrowUpRight, UserRound, Users } from "lucide-react";
import type { RecentCandidateItem } from "../types/dashboard.types";

type RecentCandidatesTableProps = {
  candidates: RecentCandidateItem[];
  loading?: boolean;
  error?: string | null;
};

export function RecentCandidatesTable({
  candidates,
  loading = false,
  error = null,
}: RecentCandidatesTableProps) {
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
          <UserRound size={18} className="text-blue-500" />
          <h3 className="text-base font-semibold text-text">Recent Candidates</h3>
        </div>
        <Link
          href="/admin/users/candidates"
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
            Unable to load recent candidates.
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-8 text-center">
            <Users size={24} className="mx-auto text-muted/60 mb-2" />
            <p className="text-sm font-medium text-text">
              No candidate registrations yet.
            </p>
            <p className="text-xs text-muted mt-0.5">
              New candidate sign-ups will appear here.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-surface/50 text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-border">
              <tr>
                <th scope="col" className="px-5 py-3">
                  Candidate
                </th>
                <th scope="col" className="px-4 py-3">
                  Registered
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {candidates.map((cand) => (
                <tr key={cand.id} className="transition hover:bg-surface/40">
                  <td className="px-5 py-3">
                    <div className="font-medium text-text">{cand.name}</div>
                    <div className="text-[11px] text-muted">{cand.email}</div>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(cand.registrationDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {cand.status}
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
