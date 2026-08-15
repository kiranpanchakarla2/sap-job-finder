"use client";

import Link from "next/link";
import { Bell, CheckCircle2, Search } from "lucide-react";
import type {
  NotificationCategoryFilter,
  NotificationFilter,
} from "../types/notification.types";

interface NotificationEmptyStateProps {
  statusFilter: NotificationFilter;
  categoryFilter: NotificationCategoryFilter;
  onResetFilters: () => void;
}

export function NotificationEmptyState({
  statusFilter,
  categoryFilter,
  onResetFilters,
}: NotificationEmptyStateProps) {
  if (statusFilter === "unread") {
    return (
      <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-border bg-card/60 px-6 py-14 text-center shadow-soft">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
          <CheckCircle2 size={26} aria-hidden="true" />
        </span>
        <h3 className="text-lg font-bold text-text">You&apos;re all caught up</h3>
        <p className="mt-1.5 max-w-sm text-sm text-muted">
          You don&apos;t have any unread notifications right now.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-5 inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-text shadow-soft transition hover:bg-surface hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          View All Notifications
        </button>
      </div>
    );
  }

  if (categoryFilter !== "all") {
    return (
      <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-border bg-card/60 px-6 py-14 text-center shadow-soft">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Search size={26} aria-hidden="true" />
        </span>
        <h3 className="text-lg font-bold text-text">No notifications found</h3>
        <p className="mt-1.5 max-w-sm text-sm text-muted">
          There are no notifications in this category.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-5 inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-text shadow-soft transition hover:bg-surface hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          Clear Filters
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-border bg-card/60 px-6 py-14 text-center shadow-soft">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Bell size={26} aria-hidden="true" />
      </span>
      <h3 className="text-lg font-bold text-text">No notifications yet</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted">
        Updates about your applications, messages, job alerts, and interview invites will appear here.
      </p>
      <Link
        href="/candidate/jobs"
        className="mt-5 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
      >
        Browse SAP Jobs
      </Link>
    </div>
  );
}
