"use client";

import { CheckCheck } from "lucide-react";

interface NotificationHeaderProps {
  unreadCount: number;
  onMarkAllAsRead: () => void;
  isMarkingAll?: boolean;
}

export function NotificationHeader({
  unreadCount,
  onMarkAllAsRead,
  isMarkingAll = false,
}: NotificationHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Notifications
          </h1>
          {unreadCount > 0 ? (
            <span
              className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary"
              aria-label={`${unreadCount} unread notifications`}
            >
              {unreadCount} new
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted">
          Stay updated on your applications, messages, jobs and account activity.
        </p>
      </div>

      {unreadCount > 0 ? (
        <button
          type="button"
          onClick={onMarkAllAsRead}
          disabled={isMarkingAll}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-text shadow-soft transition hover:bg-surface hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50 sm:self-auto"
          aria-label="Mark all notifications as read"
        >
          <CheckCheck size={16} className="text-muted" aria-hidden="true" />
          Mark all as read
        </button>
      ) : null}
    </div>
  );
}
