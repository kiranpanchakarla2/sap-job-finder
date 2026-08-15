"use client";

import { useMemo, useState } from "react";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { NotificationEmptyState } from "../components/NotificationEmptyState";
import { NotificationFilters } from "../components/NotificationFilters";
import { NotificationHeader } from "../components/NotificationHeader";
import { NotificationList } from "../components/NotificationList";
import { NotificationListSkeleton } from "../components/NotificationSkeletons";
import { useCandidateNotifications } from "../context/CandidateNotificationsProvider";
import { getNotificationMeta } from "../lib/notificationUtils";
import type {
  NotificationCategoryFilter,
  NotificationFilter,
} from "../types/notification.types";

export function CandidateNotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useCandidateNotifications();

  const [statusFilter, setStatusFilter] = useState<NotificationFilter>("all");
  const [categoryFilter, setCategoryFilter] =
    useState<NotificationCategoryFilter>("all");
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const handleMarkAllAsRead = async () => {
    try {
      setIsMarkingAll(true);
      await markAllAsRead();
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleResetFilters = () => {
    setStatusFilter("all");
    setCategoryFilter("all");
  };

  // Compute category counts for current status filter
  const categoryCounts = useMemo(() => {
    const counts: Record<NotificationCategoryFilter, number> = {
      all: notifications.length,
      applications: 0,
      messages: 0,
      jobs: 0,
      interviews: 0,
      account: 0,
    };

    for (const item of notifications) {
      const meta = getNotificationMeta(item.type);
      counts[meta.category] = (counts[meta.category] ?? 0) + 1;
    }

    return counts;
  }, [notifications]);

  // Filter items based on active status and category
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (statusFilter === "unread" && item.isRead) {
        return false;
      }
      if (categoryFilter !== "all") {
        const meta = getNotificationMeta(item.type);
        if (meta.category !== categoryFilter) {
          return false;
        }
      }
      return true;
    });
  }, [notifications, statusFilter, categoryFilter]);

  return (
    <div className="mx-auto max-w-7xl w-full space-y-6">
      <NotificationHeader
        unreadCount={unreadCount}
        onMarkAllAsRead={handleMarkAllAsRead}
        isMarkingAll={isMarkingAll}
      />

      <NotificationFilters
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        totalCount={notifications.length}
        unreadCount={unreadCount}
        categoryCounts={categoryCounts}
      />

      {loading ? (
        <NotificationListSkeleton />
      ) : error ? (
        <ErrorState
          title="Unable to load notifications"
          description={error}
          onRetry={refreshNotifications}
        />
      ) : filteredNotifications.length === 0 ? (
        <NotificationEmptyState
          statusFilter={statusFilter}
          categoryFilter={categoryFilter}
          onResetFilters={handleResetFilters}
        />
      ) : (
        <NotificationList
          notifications={filteredNotifications}
          onMarkAsRead={markAsRead}
        />
      )}
    </div>
  );
}
