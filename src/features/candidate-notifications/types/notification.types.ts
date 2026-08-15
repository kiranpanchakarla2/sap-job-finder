/**
 * TypeScript definitions for Candidate Notifications.
 */

export type NotificationType =
  | "application"
  | "message"
  | "job_alert"
  | "interview"
  | "saved_job"
  | "subscription"
  | "security"
  | "system";

export type NotificationPriority = "normal" | "important";

export type NotificationRelatedEntityType =
  | "application"
  | "message"
  | "job"
  | "job_alert"
  | "interview"
  | "subscription"
  | "settings";

export interface CandidateNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  createdAt: string; // ISO 8601 string
  readAt?: string | null;
  isRead: boolean;
  priority: NotificationPriority;
  relatedEntityType?: NotificationRelatedEntityType;
  relatedEntityId?: string;
  actionUrl?: string;
  actionLabel?: string;
}

export type NotificationFilter = "all" | "unread";

export type NotificationCategoryFilter =
  | "all"
  | "applications"
  | "messages"
  | "jobs"
  | "interviews"
  | "account";

export interface NotificationGroup {
  groupTitle: "Today" | "Yesterday" | "Earlier this week" | "Earlier";
  notifications: CandidateNotification[];
}

export type CandidateNotificationServiceResult<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: string };
