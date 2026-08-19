"use client";

/**
 * ContactUsSummaryCard Component
 * Displays Contact Us enquiry metrics (New, In Progress, Resolved, Total).
 */

import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock, Inbox, MessageSquare } from "lucide-react";
import type { ContactUsSummary } from "../types/dashboard.types";

type ContactUsSummaryCardProps = {
  summary: ContactUsSummary;
  loading?: boolean;
  error?: string | null;
};

export function ContactUsSummaryCard({
  summary,
  loading = false,
  error = null,
}: ContactUsSummaryCardProps) {
  if (loading) {
    return (
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft animate-pulse">
        <div className="h-5 w-32 rounded bg-surface/60 mb-4" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-16 rounded-lg bg-surface/40" />
          <div className="h-16 rounded-lg bg-surface/40" />
          <div className="h-16 rounded-lg bg-surface/40" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[var(--radius-card)] border border-rose-500/20 bg-rose-500/5 p-5 shadow-soft text-xs text-rose-500">
        Unable to load contact enquiries summary.
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-rose-500" />
            <h3 className="text-base font-semibold text-text">
              Contact Enquiries
            </h3>
          </div>
          <span className="text-xs font-semibold text-text bg-surface px-2 py-0.5 rounded-full border border-border">
            Total: {summary.totalCount}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 text-center">
          {/* New */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
              New
            </span>
            <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
              {summary.newCount}
            </span>
          </div>

          {/* In Progress */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
              In Progress
            </span>
            <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
              {summary.inProgressCount}
            </span>
          </div>

          {/* Resolved */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
              Resolved
            </span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {summary.resolvedCount}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border flex justify-end">
        <Link
          href="/admin/contact-us"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:text-primary/80"
        >
          <span>View Enquiries</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  );
}
