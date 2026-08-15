import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type {
  CandidateNotification,
  CandidateNotificationServiceResult,
  NotificationPriority,
  NotificationRelatedEntityType,
  NotificationType,
} from "../types/notification.types";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

const ERR = {
  auth: "Please sign in to view notifications.",
  load: "Unable to load notifications.",
  markRead: "Failed to mark notification as read.",
  markAllRead: "Failed to mark all notifications as read.",
} as const;

function logError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[candidateNotificationService] ${context}`, error);
  }
}

function mapRowToCandidateNotification(
  row: NotificationRow,
): CandidateNotification {
  return {
    id: row.id,
    type: (row.type as NotificationType) || "system",
    title: row.title,
    description: row.description || row.message || "",
    createdAt: row.created_at,
    readAt: row.read_at,
    isRead: row.read_at !== null,
    priority: (row.priority as NotificationPriority) || "normal",
    relatedEntityType:
      (row.related_entity_type as NotificationRelatedEntityType) || undefined,
    relatedEntityId: row.related_entity_id || undefined,
    actionUrl: row.action_url || undefined,
    actionLabel: row.action_label || undefined,
  };
}

class CandidateNotificationService {
  /**
   * Fetches real notifications for the authenticated candidate.
   * Ordered by created_at DESC with limit.
   */
  async getNotifications(
    limit: number = 50,
  ): Promise<CandidateNotificationServiceResult<CandidateNotification[]>> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        logError("getNotifications", error);
        return { success: false, error: ERR.load };
      }

      return {
        success: true,
        data: (data || []).map(mapRowToCandidateNotification),
      };
    } catch (err) {
      logError("getNotifications unexpected error", err);
      return { success: false, error: ERR.load };
    }
  }

  /**
   * Fetches dynamic count of unread notifications (read_at IS NULL).
   */
  async getUnreadCount(): Promise<CandidateNotificationServiceResult<number>> {
    try {
      const supabase = createClient();
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .is("read_at", null);

      if (error) {
        logError("getUnreadCount", error);
        return { success: true, data: 0 };
      }

      return {
        success: true,
        data: count ?? 0,
      };
    } catch (err) {
      logError("getUnreadCount unexpected error", err);
      return { success: true, data: 0 };
    }
  }

  /**
   * Marks a specific notification as read in Supabase.
   */
  async markAsRead(
    id: string,
  ): Promise<CandidateNotificationServiceResult<CandidateNotification>> {
    try {
      const supabase = createClient();
      const nowIso = new Date().toISOString();

      const { data, error } = await supabase
        .from("notifications")
        .update({ read_at: nowIso })
        .eq("id", id)
        .select()
        .single();

      if (error || !data) {
        logError("markAsRead", error);
        return { success: false, error: ERR.markRead };
      }

      return {
        success: true,
        data: mapRowToCandidateNotification(data),
      };
    } catch (err) {
      logError("markAsRead unexpected error", err);
      return { success: false, error: ERR.markRead };
    }
  }

  /**
   * Marks all unread candidate notifications as read in a single batch query.
   */
  async markAllAsRead(): Promise<CandidateNotificationServiceResult<void>> {
    try {
      const supabase = createClient();
      const nowIso = new Date().toISOString();

      const { error } = await supabase
        .from("notifications")
        .update({ read_at: nowIso })
        .is("read_at", null);

      if (error) {
        logError("markAllAsRead", error);
        return { success: false, error: ERR.markAllRead };
      }

      return {
        success: true,
        data: undefined,
      };
    } catch (err) {
      logError("markAllAsRead unexpected error", err);
      return { success: false, error: ERR.markAllRead };
    }
  }

  /**
   * Realtime subscription for candidate notifications.
   * Scoped securely to the authenticated user's ID.
   */
  subscribeToNotifications(
    userId: string,
    onChange: () => void,
  ): () => void {
    if (!userId) return () => {};

    const supabase = createClient();
    const channel = supabase
      .channel(`candidate-notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          onChange();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }
}

export const candidateNotificationService = new CandidateNotificationService();
