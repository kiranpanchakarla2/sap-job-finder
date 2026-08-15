"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";
import { candidateNotificationService } from "../services/candidateNotificationService";
import type { CandidateNotification } from "../types/notification.types";

interface CandidateNotificationsContextValue {
  notifications: CandidateNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const CandidateNotificationsContext =
  createContext<CandidateNotificationsContextValue | null>(null);

export function CandidateNotificationsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<CandidateNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await candidateNotificationService.getNotifications();
      if (result.success) {
        setNotifications(result.data);
      } else {
        setError(result.error ?? "Unable to load notifications.");
      }
    } catch {
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    void refreshNotifications();
  }, [authLoading, refreshNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const markAsRead = useCallback(
    async (id: string) => {
      const target = notifications.find((n) => n.id === id);
      if (!target || target.isRead) return;

      const nowIso = new Date().toISOString();
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: nowIso } : n)),
      );

      const result = await candidateNotificationService.markAsRead(id);
      if (!result.success) {
        // Revert on failure
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? target : n)),
        );
        toast.error("Failed to update notification.");
      }
    },
    [notifications],
  );

  const markAllAsRead = useCallback(async () => {
    const previous = [...notifications];
    const hasUnread = notifications.some((n) => !n.isRead);
    if (!hasUnread) return;

    const nowIso = new Date().toISOString();
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.isRead ? n : { ...n, isRead: true, readAt: nowIso })),
    );

    const result = await candidateNotificationService.markAllAsRead();
    if (!result.success) {
      setNotifications(previous);
      toast.error("Failed to mark all notifications as read.");
      return;
    }
    toast.success("All notifications marked as read.");
  }, [notifications]);

  const value = useMemo<CandidateNotificationsContextValue>(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      markAsRead,
      markAllAsRead,
      refreshNotifications,
    }),
    [
      notifications,
      unreadCount,
      loading,
      error,
      markAsRead,
      markAllAsRead,
      refreshNotifications,
    ],
  );

  return (
    <CandidateNotificationsContext.Provider value={value}>
      {children}
    </CandidateNotificationsContext.Provider>
  );
}

export function useCandidateNotifications(): CandidateNotificationsContextValue {
  const ctx = useContext(CandidateNotificationsContext);
  if (!ctx) {
    throw new Error(
      "useCandidateNotifications must be used within CandidateNotificationsProvider",
    );
  }
  return ctx;
}
