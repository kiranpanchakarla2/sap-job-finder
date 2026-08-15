"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import {
  formatNotificationTime,
  getNotificationDestination,
  getNotificationMeta,
} from "../lib/notificationUtils";
import type { CandidateNotification } from "../types/notification.types";

interface NotificationItemProps {
  notification: CandidateNotification;
  onMarkAsRead: (id: string) => Promise<void>;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
}: NotificationItemProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const meta = getNotificationMeta(notification.type);
  const Icon = meta.icon;
  const destination = getNotificationDestination(notification);
  const timeFormatted = formatNotificationTime(notification.createdAt);

  const handleClick = async () => {
    if (isNavigating) return;
    setIsNavigating(true);

    if (!notification.isRead) {
      await onMarkAsRead(notification.id);
    }

    if (destination) {
      router.push(destination);
    } else {
      setIsNavigating(false);
    }
  };

  const handleMarkAsReadClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onMarkAsRead(notification.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      void handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${notification.title}. ${notification.description}. ${
        notification.isRead ? "Read" : "Unread"
      }. Press Enter to view.`}
      className={`group relative flex flex-col gap-3 rounded-[var(--radius-card)] border p-4 sm:p-5 transition cursor-pointer shadow-soft outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
        notification.isRead
          ? "border-border bg-card hover:border-border/80 hover:bg-surface/50"
          : "border-primary/30 bg-primary/[0.03] hover:border-primary/50 hover:bg-primary/[0.06]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Icon and Header information */}
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.iconBg} ${meta.iconText} transition group-hover:scale-105`}
          >
            <Icon size={18} aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${meta.badgeBg} ${meta.badgeText}`}
              >
                {meta.categoryLabel}
              </span>

              {notification.priority === "important" ? (
                <span className="inline-flex items-center rounded-md bg-warning/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning">
                  Priority
                </span>
              ) : null}

              {!notification.isRead ? (
                <span
                  className="flex h-2 w-2 rounded-full bg-primary"
                  title="Unread notification"
                  aria-hidden="true"
                />
              ) : null}

              <span className="text-xs text-muted">
                {timeFormatted}
              </span>
            </div>

            <h3
              className={`mt-1.5 text-sm sm:text-base leading-snug text-text ${
                notification.isRead ? "font-medium text-text/90" : "font-bold text-text"
              }`}
            >
              {notification.title}
            </h3>

            <p className="mt-1 text-xs sm:text-sm leading-relaxed text-muted line-clamp-2 sm:line-clamp-3">
              {notification.description}
            </p>
          </div>
        </div>

        {/* Right: Mark Read button & action indicator */}
        <div className="flex items-center gap-1.5 shrink-0 self-start">
          {!notification.isRead ? (
            <button
              type="button"
              onClick={handleMarkAsReadClick}
              title="Mark as read"
              aria-label="Mark notification as read"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Check size={14} aria-hidden="true" />
            </button>
          ) : null}

          <div className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted/60 transition group-hover:translate-x-0.5 group-hover:text-primary">
            <ChevronRight size={18} aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Inline Action Link on Mobile / Desktop Footer */}
      {notification.actionLabel ? (
        <div className="mt-0.5 flex items-center justify-between border-t border-border/40 pt-2.5 sm:border-0 sm:pt-0">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition group-hover:text-accent">
            {notification.actionLabel}
            <ChevronRight size={14} aria-hidden="true" />
          </span>
          <span className="text-[11px] text-muted sm:hidden">{timeFormatted}</span>
        </div>
      ) : null}
    </div>
  );
}
