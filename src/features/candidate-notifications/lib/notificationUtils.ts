import {
  Bell,
  Bookmark,
  Briefcase,
  CalendarDays,
  CreditCard,
  Info,
  MessageSquare,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type {
  CandidateNotification,
  NotificationCategoryFilter,
  NotificationGroup,
  NotificationType,
} from "../types/notification.types";

/**
 * Returns safe navigation target URL for any given notification.
 */
export function getNotificationDestination(notification: CandidateNotification): string {
  if (notification.actionUrl) {
    return notification.actionUrl;
  }

  switch (notification.type) {
    case "application":
      return notification.relatedEntityId
        ? `/candidate/applications/${notification.relatedEntityId}`
        : "/candidate/applications";
    case "message":
      return notification.relatedEntityId
        ? `/candidate/messages?conversationId=${encodeURIComponent(notification.relatedEntityId)}`
        : "/candidate/messages";
    case "job_alert":
      return "/candidate/job-alerts";
    case "saved_job":
      return "/candidate/saved-jobs";
    case "interview":
      return notification.relatedEntityId
        ? `/candidate/applications/${notification.relatedEntityId}`
        : "/candidate/applications";
    case "subscription":
      return "/candidate/settings";
    case "security":
      return "/candidate/settings";
    case "system":
    default:
      return "/candidate/dashboard";
  }
}

/**
 * Metadata definitions for icons, semantic colors, and categories.
 */
export interface NotificationMeta {
  icon: LucideIcon;
  categoryLabel: string;
  category: NotificationCategoryFilter;
  badgeBg: string;
  badgeText: string;
  iconBg: string;
  iconText: string;
}

export function getNotificationMeta(type: NotificationType): NotificationMeta {
  switch (type) {
    case "application":
      return {
        icon: Briefcase,
        categoryLabel: "Application",
        category: "applications",
        badgeBg: "bg-primary/10",
        badgeText: "text-primary",
        iconBg: "bg-primary/10",
        iconText: "text-primary",
      };
    case "message":
      return {
        icon: MessageSquare,
        categoryLabel: "Message",
        category: "messages",
        badgeBg: "bg-accent/10",
        badgeText: "text-accent",
        iconBg: "bg-accent/10",
        iconText: "text-accent",
      };
    case "job_alert":
      return {
        icon: Bell,
        categoryLabel: "Job Alert",
        category: "jobs",
        badgeBg: "bg-warning/10",
        badgeText: "text-warning",
        iconBg: "bg-warning/10",
        iconText: "text-warning",
      };
    case "interview":
      return {
        icon: CalendarDays,
        categoryLabel: "Interview",
        category: "interviews",
        badgeBg: "bg-success/10",
        badgeText: "text-success",
        iconBg: "bg-success/10",
        iconText: "text-success",
      };
    case "saved_job":
      return {
        icon: Bookmark,
        categoryLabel: "Saved Job",
        category: "jobs",
        badgeBg: "bg-primary/10",
        badgeText: "text-primary",
        iconBg: "bg-primary/10",
        iconText: "text-primary",
      };
    case "subscription":
      return {
        icon: CreditCard,
        categoryLabel: "Subscription",
        category: "account",
        badgeBg: "bg-accent/10",
        badgeText: "text-accent",
        iconBg: "bg-accent/10",
        iconText: "text-accent",
      };
    case "security":
      return {
        icon: ShieldCheck,
        categoryLabel: "Security",
        category: "account",
        badgeBg: "bg-error/10",
        badgeText: "text-error",
        iconBg: "bg-error/10",
        iconText: "text-error",
      };
    case "system":
    default:
      return {
        icon: Info,
        categoryLabel: "System",
        category: "account",
        badgeBg: "bg-surface",
        badgeText: "text-muted",
        iconBg: "bg-surface",
        iconText: "text-muted",
      };
  }
}

/**
 * Returns formatted relative or humanized date string.
 */
export function formatNotificationTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24 && date.getDate() === now.getDate()) {
      return `${diffHour}h ago`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const timeStr = date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    }

    const isSameYear = date.getFullYear() === now.getFullYear();
    const dateStr = date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: isSameYear ? undefined : "numeric",
    });

    return `${dateStr}, ${timeStr}`;
  } catch {
    return "";
  }
}

/**
 * Groups a list of notifications by date sections:
 * "Today", "Yesterday", "Earlier this week", "Earlier".
 */
export function groupNotificationsByDate(
  notifications: CandidateNotification[],
): NotificationGroup[] {
  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayDate = todayDate - 24 * 60 * 60 * 1000;
  const weekDate = todayDate - 6 * 24 * 60 * 60 * 1000;

  const groups: Record<NotificationGroup["groupTitle"], CandidateNotification[]> = {
    Today: [],
    Yesterday: [],
    "Earlier this week": [],
    Earlier: [],
  };

  // Sort descending
  const sorted = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  for (const item of sorted) {
    const itemDate = new Date(item.createdAt);
    const itemDay = new Date(
      itemDate.getFullYear(),
      itemDate.getMonth(),
      itemDate.getDate(),
    ).getTime();

    if (itemDay >= todayDate) {
      groups.Today.push(item);
    } else if (itemDay >= yesterdayDate) {
      groups.Yesterday.push(item);
    } else if (itemDay >= weekDate) {
      groups["Earlier this week"].push(item);
    } else {
      groups.Earlier.push(item);
    }
  }

  const order: NotificationGroup["groupTitle"][] = [
    "Today",
    "Yesterday",
    "Earlier this week",
    "Earlier",
  ];

  return order
    .filter((title) => groups[title].length > 0)
    .map((groupTitle) => ({
      groupTitle,
      notifications: groups[groupTitle],
    }));
}
