"use client";

/**
 * SubscriptionSummaryCard Component
 * Displays a clean side-by-side comparison summary of Candidate vs Employer subscriptions.
 */

import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  CreditCard,
  UserCheck,
  Zap,
} from "lucide-react";
import type { SubscriptionKpis } from "../types/dashboard.types";

type SubscriptionSummaryCardProps = {
  kpis: SubscriptionKpis;
  loading?: boolean;
  error?: string | null;
};

export function SubscriptionSummaryCard({
  kpis,
  loading = false,
  error = null,
}: SubscriptionSummaryCardProps) {
  if (loading) {
    return (
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft animate-pulse">
        <div className="h-5 w-40 rounded bg-surface/60 mb-4" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-28 rounded-xl bg-surface/40" />
          <div className="h-28 rounded-xl bg-surface/40" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[var(--radius-card)] border border-rose-500/20 bg-rose-500/5 p-5 shadow-soft text-xs text-rose-500">
        Unable to load subscription summary.
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <CreditCard size={18} className="text-primary" />
          <h3 className="text-base font-semibold text-text">
            Subscription Breakdown
          </h3>
        </div>
        <Link
          href="/admin/subscriptions/active"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:text-primary/80"
        >
          <span>Active Plans</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Candidate Subscriptions Card */}
        <div className="rounded-xl border border-border/80 bg-surface/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-sm text-text">
              <UserCheck size={16} className="text-blue-500" />
              <span>Candidate Subscriptions</span>
            </div>
            <Link
              href="/admin/subscriptions/candidate-plans"
              className="text-[11px] text-muted hover:text-primary transition"
            >
              Plans →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-card p-2.5 border border-border/60">
              <span className="text-[10px] uppercase font-semibold text-muted block">
                Active
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {kpis.activeCandidateSubs}
              </span>
            </div>

            <div className="rounded-lg bg-card p-2.5 border border-border/60">
              <span className="text-[10px] uppercase font-semibold text-muted block">
                Expiring (7d)
              </span>
              <span
                className={`text-lg font-bold ${
                  kpis.expiringCandidateSubs > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted"
                }`}
              >
                {kpis.expiringCandidateSubs}
              </span>
            </div>
          </div>
        </div>

        {/* Employer Subscriptions Card */}
        <div className="rounded-xl border border-border/80 bg-surface/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-sm text-text">
              <Building2 size={16} className="text-indigo-500" />
              <span>Employer Subscriptions</span>
            </div>
            <Link
              href="/admin/subscriptions/employer-plans"
              className="text-[11px] text-muted hover:text-primary transition"
            >
              Plans →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-card p-2.5 border border-border/60">
              <span className="text-[10px] uppercase font-semibold text-muted block">
                Active
              </span>
              <span className="text-lg font-bold text-primary">
                {kpis.activeEmployerSubs}
              </span>
            </div>

            <div className="rounded-lg bg-card p-2.5 border border-border/60">
              <span className="text-[10px] uppercase font-semibold text-muted block">
                Expiring (7d)
              </span>
              <span
                className={`text-lg font-bold ${
                  kpis.expiringEmployerSubs > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-muted"
                }`}
              >
                {kpis.expiringEmployerSubs}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Activated Banner */}
      <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 px-3.5 py-2 text-xs">
        <div className="flex items-center gap-2 text-text">
          <Zap size={14} className="text-primary" />
          <span>Recently Activated Subscriptions (30d):</span>
        </div>
        <span className="font-bold text-primary">
          {kpis.recentlyActivatedCount}
        </span>
      </div>
    </div>
  );
}
