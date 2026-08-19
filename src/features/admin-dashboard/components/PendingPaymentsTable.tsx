"use client";

/**
 * PendingPaymentsTable Component
 * Prominent operational preview table of pending manual payment requests.
 */

import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Clock, Inbox, Send } from "lucide-react";
import type { PendingPaymentItem } from "../types/dashboard.types";

type PendingPaymentsTableProps = {
  items: PendingPaymentItem[];
  loading?: boolean;
  error?: string | null;
};

export function PendingPaymentsTable({
  items,
  loading = false,
  error = null,
}: PendingPaymentsTableProps) {
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

  const getStatusBadge = (status: PendingPaymentItem["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock size={11} />
            Pending Link
          </span>
        );
      case "payment_link_sent":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Send size={11} />
            Link Sent
          </span>
        );
      case "payment_received":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={11} />
            Paid
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-muted border border-border">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-card shadow-soft overflow-hidden">
      {/* Table Header */}
      <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-border bg-surface/30">
        <div>
          <div className="flex items-center gap-2">
            <Inbox size={18} className="text-primary" />
            <h3 className="text-base font-semibold text-text">
              Pending Payment Requests
            </h3>
            {items.length > 0 && !loading && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {items.length} Pending
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted">
            High priority manual payment requests awaiting administrative processing
          </p>
        </div>

        <Link
          href="/admin/payments/requests"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:text-primary/80 focus:outline-none"
        >
          <span>View All</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="p-6 space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-full rounded bg-surface/60" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 text-center text-xs text-rose-500">
          Unable to load pending payment requests.
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted">
            <CheckCircle2 size={24} className="text-emerald-500" />
          </div>
          <p className="mt-3 text-sm font-medium text-text">
            No pending payment requests.
          </p>
          <p className="mt-1 text-xs text-muted">
            All submitted payment requests have been processed.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface/50 text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-border">
              <tr>
                <th scope="col" className="px-5 py-3">
                  Requester
                </th>
                <th scope="col" className="px-4 py-3">
                  Type
                </th>
                <th scope="col" className="px-4 py-3">
                  Plan
                </th>
                <th scope="col" className="px-4 py-3">
                  Amount
                </th>
                <th scope="col" className="px-4 py-3">
                  Requested
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="transition hover:bg-surface/40"
                >
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-text">
                      {item.requesterName}
                    </div>
                    <div className="text-[11px] text-muted">{item.email}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium border ${
                        item.accountType === "employer"
                          ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                      }`}
                    >
                      {item.accountType === "employer" ? "Employer" : "Candidate"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-text">
                    {item.planName}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-text">
                    ₹{item.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3.5 text-muted">
                    {formatDate(item.requestedAt)}
                  </td>
                  <td className="px-4 py-3.5">{getStatusBadge(item.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
