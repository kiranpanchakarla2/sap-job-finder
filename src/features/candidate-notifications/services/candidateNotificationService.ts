import { INITIAL_MOCK_NOTIFICATIONS } from "../data/mockNotifications";
import type {
  CandidateNotification,
  CandidateNotificationServiceResult,
} from "../types/notification.types";

class CandidateNotificationService {
  private notifications: CandidateNotification[] = [...INITIAL_MOCK_NOTIFICATIONS];

  /**
   * Fetches all candidate notifications.
   */
  async getNotifications(): Promise<
    CandidateNotificationServiceResult<CandidateNotification[]>
  > {
    // Simulates a quick network latency
    await new Promise((resolve) => setTimeout(resolve, 80));
    return {
      success: true,
      data: [...this.notifications],
    };
  }

  /**
   * Fetches the dynamic unread notifications count.
   */
  async getUnreadCount(): Promise<CandidateNotificationServiceResult<number>> {
    const unread = this.notifications.filter((n) => !n.isRead).length;
    return {
      success: true,
      data: unread,
    };
  }

  /**
   * Marks a specific notification as read.
   */
  async markAsRead(
    id: string,
  ): Promise<CandidateNotificationServiceResult<CandidateNotification>> {
    const item = this.notifications.find((n) => n.id === id);
    if (!item) {
      return {
        success: false,
        error: "Notification not found.",
      };
    }

    const updated: CandidateNotification = {
      ...item,
      isRead: true,
      readAt: new Date().toISOString(),
    };

    this.notifications = this.notifications.map((n) =>
      n.id === id ? updated : n,
    );

    return {
      success: true,
      data: updated,
    };
  }

  /**
   * Marks all candidate notifications as read.
   */
  async markAllAsRead(): Promise<CandidateNotificationServiceResult<void>> {
    const nowIso = new Date().toISOString();
    this.notifications = this.notifications.map((n) =>
      n.isRead ? n : { ...n, isRead: true, readAt: nowIso },
    );

    return {
      success: true,
      data: undefined,
    };
  }

  /**
   * Resets mock data to initial state (useful for test retries).
   */
  resetMockData() {
    this.notifications = [...INITIAL_MOCK_NOTIFICATIONS];
  }
}

export const candidateNotificationService = new CandidateNotificationService();
