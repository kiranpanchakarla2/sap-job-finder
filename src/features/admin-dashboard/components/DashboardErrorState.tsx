"use client";

/**
 * DashboardErrorState Component
 * Error alert banner with retry trigger for database query failures.
 */

import { AlertCircle, RefreshCw } from "lucide-react";

type DashboardErrorStateProps = {
  message?: string;
  onRetry: () => void;
};

export function DashboardErrorState({
  message = "Failed to load complete dashboard analytics from the database.",
  onRetry,
}: DashboardErrorStateProps) {
  return (
    <div className="rounded-[var(--radius-card)] border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-700 dark:text-rose-300 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <AlertCircle size={18} className="text-rose-500 shrink-0" />
          <div>
            <span className="font-semibold block sm:inline">
              Data Synchronization Warning:
            </span>{" "}
            <span>{message}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-400"
        >
          <RefreshCw size={12} />
          <span>Retry</span>
        </button>
      </div>
    </div>
  );
}
