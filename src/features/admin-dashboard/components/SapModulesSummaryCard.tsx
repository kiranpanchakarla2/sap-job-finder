"use client";

/**
 * SapModulesSummaryCard Component
 * Displays SAP module statistics and active module usage.
 */

import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Grid, Layers } from "lucide-react";
import type { SapModuleSummary } from "../types/dashboard.types";

type SapModulesSummaryCardProps = {
  summary: SapModuleSummary;
  loading?: boolean;
  error?: string | null;
};

export function SapModulesSummaryCard({
  summary,
  loading = false,
  error = null,
}: SapModulesSummaryCardProps) {
  if (loading) {
    return (
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft animate-pulse">
        <div className="h-5 w-32 rounded bg-surface/60 mb-4" />
        <div className="space-y-2">
          <div className="h-4 rounded bg-surface/40 w-full" />
          <div className="h-4 rounded bg-surface/40 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[var(--radius-card)] border border-rose-500/20 bg-rose-500/5 p-5 shadow-soft text-xs text-rose-500">
        Unable to load SAP modules summary.
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Grid size={18} className="text-teal-500" />
            <h3 className="text-base font-semibold text-text">SAP Modules</h3>
          </div>
          <span className="rounded-full bg-teal-500/10 px-2.5 py-0.5 text-xs font-bold text-teal-600 dark:text-teal-400 border border-teal-500/20">
            {summary.totalActiveModules} Active
          </span>
        </div>

        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-2">
            Top In-Demand Modules
          </span>

          {summary.topModules.length === 0 ? (
            <p className="text-xs text-muted py-2">
              No active job postings by module yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {summary.topModules.map((item) => (
                <span
                  key={item.module}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1 text-xs font-medium text-text border border-border/60"
                >
                  <span>{item.module}</span>
                  <span className="rounded bg-primary/10 px-1 py-0.2 text-[10px] font-bold text-primary">
                    {item.jobCount} jobs
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border flex justify-end">
        <Link
          href="/admin/sap-modules"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:text-primary/80"
        >
          <span>Manage Modules</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  );
}
