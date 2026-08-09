"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

export function NotificationBell({
  count = 0,
  href,
}: {
  count?: number;
  href?: string;
}) {
  const content = (
    <>
      <Bell size={16} aria-hidden="true" />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </>
  );

  const className =
    "relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted transition hover:text-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20";
  const label = `Notifications${count ? `, ${count} unread` : ""}`;

  if (href) {
    return (
      <Link href={href} className={className} aria-label={label}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={className} aria-label={label}>
      {content}
    </button>
  );
}
