"use client";

/**
 * RecentEmployersTable Component
 * Shows recent employer registrations preview table.
 */

import Link from "next/link";
import { ArrowUpRight, Building2 } from "lucide-react";
import type { RecentEmployerItem } from "../types/dashboard.types";

type RecentEmployersTableProps = {
  employers: RecentEmployerItem[];
  loading?: boolean;
  error?: string | null;
};

export function RecentEmployersTable({
  employers,
  loading = false,
  error = null,
}: RecentEmployersTableProps) {
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
          <Building2 size={18} className="text-indigo-500" />
          <h3 className="text-base font-semibold text-text">Recent Employers</h3>
        </div>
        <Link
          href="/admin/users/employers"
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
            Unable to load recent employers.
          </div>
        ) : employers.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 size={24} className="mx-auto text-muted/60 mb-2" />
            <p className="text-sm font-medium text-text">
              No employer registrations yet.
            </p>
            <p className="text-xs text-muted mt-0.5">
              New employer company accounts will appear here.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-surface/50 text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-border">
              <tr>
                <th scope="col" className="px-5 py-3">
                  Company
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
              {employers.map((emp) => (
                <tr key={emp.id} className="transition hover:bg-surface/40">
                  <td className="px-5 py-3">
                    <div className="font-medium text-text">{emp.companyName}</div>
                    <div className="text-[11px] text-muted">{emp.email}</div>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(emp.registrationDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold border ${
                        emp.status.includes("Active")
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {emp.status}
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
