"use client";

import { groupNotificationsByDate } from "../lib/notificationUtils";
import type { CandidateNotification } from "../types/notification.types";
import { NotificationItem } from "./NotificationItem";

interface NotificationListProps {
  notifications: CandidateNotification[];
  onMarkAsRead: (id: string) => Promise<void>;
}

export function NotificationList({
  notifications,
  onMarkAsRead,
}: NotificationListProps) {
  const groups = groupNotificationsByDate(notifications);

  return (
    <div className="space-y-6" role="feed" aria-label="Notifications feed">
      {groups.map((group) => (
        <section key={group.groupTitle} className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
              {group.groupTitle}
            </h2>
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-xs text-muted">
              {group.notifications.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {group.notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
