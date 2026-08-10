"use client";

import { Menu, Search } from "lucide-react";
import { NotificationBell } from "@/components/dashboard/shared/NotificationBell";
import { UserMenu } from "@/components/dashboard/shared/UserMenu";

export function TopHeader({
  onMenuClick,
  searchPlaceholder = "Search…",
  notificationsHref,
  notificationCount = 3,
  title,
}: {
  onMenuClick?: () => void;
  searchPlaceholder?: string;
  notificationsHref?: string;
  notificationCount?: number;
  /** Optional page title shown on small screens where search is hidden. */
  title?: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/90 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted transition hover:text-text lg:hidden focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        {title ? (
          <p className="truncate text-sm font-semibold text-text md:hidden">{title}</p>
        ) : null}

        <label className="hidden max-w-md flex-1 items-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 md:flex">
          <Search size={16} className="text-muted" aria-hidden="true" />
          <input
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-sm text-text outline-none placeholder:text-muted"
            aria-label={searchPlaceholder}
          />
        </label>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell count={notificationCount} href={notificationsHref} />
        <UserMenu />
      </div>
    </header>
  );
}
