"use client";

import Link from "next/link";
import { EMPLOYER_TALENT_SEARCH_ROUTES } from "../constants";

export function TalentSearchTabs({
  active,
}: {
  active: "search" | "saved";
}) {
  const items = [
    {
      id: "search" as const,
      label: "Search Candidates",
      href: EMPLOYER_TALENT_SEARCH_ROUTES.root,
    },
    {
      id: "saved" as const,
      label: "Saved Candidates",
      href: EMPLOYER_TALENT_SEARCH_ROUTES.saved,
    },
  ];

  return (
    <div
      role="tablist"
      aria-label="Talent search views"
      className="inline-flex flex-wrap gap-1 rounded-[var(--radius-control)] border border-border bg-card p-1"
    >
      {items.map((item) => {
        const selected = item.id === active;
        return (
          <Link
            key={item.id}
            href={item.href}
            role="tab"
            aria-selected={selected}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
              selected
                ? "bg-primary/10 text-primary"
                : "text-muted hover:text-text"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
