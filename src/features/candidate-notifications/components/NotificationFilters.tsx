"use client";

import type {
  NotificationCategoryFilter,
  NotificationFilter,
} from "../types/notification.types";

interface NotificationFiltersProps {
  statusFilter: NotificationFilter;
  onStatusFilterChange: (filter: NotificationFilter) => void;
  categoryFilter: NotificationCategoryFilter;
  onCategoryFilterChange: (category: NotificationCategoryFilter) => void;
  totalCount: number;
  unreadCount: number;
  categoryCounts: Record<NotificationCategoryFilter, number>;
}

const CATEGORIES: { id: NotificationCategoryFilter; label: string }[] = [
  { id: "all", label: "All Categories" },
  { id: "applications", label: "Applications" },
  { id: "messages", label: "Messages" },
  { id: "jobs", label: "Jobs & Alerts" },
  { id: "interviews", label: "Interviews" },
  { id: "account", label: "Account" },
];

export function NotificationFilters({
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  totalCount,
  unreadCount,
  categoryCounts,
}: NotificationFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Status Segmented Controls: All vs Unread */}
      <div
        role="tablist"
        aria-label="Notification read status filter"
        className="inline-flex rounded-xl border border-border bg-surface p-1 shadow-inner"
      >
        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === "all"}
          onClick={() => onStatusFilterChange("all")}
          className={`relative inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
            statusFilter === "all"
              ? "bg-card text-text shadow-soft"
              : "text-muted hover:text-text"
          }`}
        >
          All
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              statusFilter === "all"
                ? "bg-surface text-muted"
                : "bg-card/50 text-muted"
            }`}
          >
            {totalCount}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === "unread"}
          onClick={() => onStatusFilterChange("unread")}
          className={`relative inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
            statusFilter === "unread"
              ? "bg-card text-text shadow-soft"
              : "text-muted hover:text-text"
          }`}
        >
          Unread
          {unreadCount > 0 ? (
            <span className="rounded-full bg-primary/15 px-1.5 py-0.2 text-[10px] font-bold text-primary">
              {unreadCount}
            </span>
          ) : (
            <span className="rounded-full bg-surface px-1.5 py-0.2 text-[10px] font-bold text-muted">
              0
            </span>
          )}
        </button>
      </div>

      {/* Category Pills Filter */}
      <div
        role="tablist"
        aria-label="Filter notifications by category"
        className="flex flex-wrap items-center gap-1.5"
      >
        {CATEGORIES.map((cat) => {
          const count = categoryCounts[cat.id] ?? 0;
          if (count === 0 && cat.id !== "all" && categoryFilter !== cat.id) {
            return null;
          }
          const isSelected = categoryFilter === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onCategoryFilterChange(cat.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border bg-card text-muted hover:border-border hover:bg-surface hover:text-text"
              }`}
            >
              <span>{cat.label}</span>
              {cat.id !== "all" && count > 0 ? (
                <span className="text-[10px] opacity-70">({count})</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
