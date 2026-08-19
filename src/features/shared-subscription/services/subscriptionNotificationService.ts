import { createClient } from "@/lib/supabase/client";
import type {
  AccountType,
  RecordNotificationInput,
  RenewalMilestone,
  ServiceResult,
  SubscriptionNotificationRecord,
} from "../types/subscription.types";

function mapRowToNotification(
  row: Record<string, unknown>,
): SubscriptionNotificationRecord {
  return {
    id: String(row.id),
    subscriptionId: String(row.subscriptionId || row.subscription_id),
    accountType: (row.accountType || row.account_type) as AccountType,
    userId: row.user_id ? String(row.user_id) : null,
    candidateId: row.candidate_id ? String(row.candidate_id) : null,
    companyId: row.company_id ? String(row.company_id) : null,
    notificationType: (row.notificationType ||
      row.notification_type ||
      "subscription_renewal") as SubscriptionNotificationRecord["notificationType"],
    milestone: (row.milestone as RenewalMilestone) || "30_day",
    triggeredAt: String(row.triggeredAt || row.triggered_at),
    createdAt: row.createdAt
      ? String(row.createdAt)
      : row.created_at
      ? String(row.created_at)
      : undefined,
  };
}

/**
 * Service for recording and querying idempotent in-portal subscription milestone notifications.
 */
export const subscriptionNotificationService = {
  /**
   * Idempotently records that a milestone notification was displayed for this subscription.
   */
  async recordNotification(
    input: RecordNotificationInput,
  ): Promise<ServiceResult<SubscriptionNotificationRecord>> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc(
        "record_subscription_notification",
        {
          p_subscription_id: input.subscriptionId,
          p_account_type: input.accountType,
          p_milestone: input.milestone,
          p_notification_type: input.notificationType || "subscription_renewal",
        },
      );

      if (error) {
        return {
          success: false,
          error: error.message || "Failed to record subscription notification.",
        };
      }

      const res = data as unknown as Record<string, unknown>;
      return { success: true, data: mapRowToNotification(res) };
    } catch (err) {
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to record subscription notification.",
      };
    }
  },

  /**
   * Fetches all recorded milestone notifications for a given subscription.
   */
  async getNotifications(
    subscriptionId: string,
  ): Promise<ServiceResult<SubscriptionNotificationRecord[]>> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("subscription_notifications")
        .select("*")
        .eq("subscription_id", subscriptionId)
        .order("triggered_at", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      const list = (data || []).map(mapRowToNotification);
      return { success: true, data: list };
    } catch (err) {
      return {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to load subscription notifications.",
      };
    }
  },
};
