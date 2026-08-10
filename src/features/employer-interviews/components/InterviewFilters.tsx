"use client";

import { INTERVIEW_TAB_FILTERS, INTERVIEW_TAB_LABELS } from "../constants";
import type { InterviewTabFilter } from "../types/interview.types";

export function InterviewFilters({
  value,
  onChange,
}: {
  value: InterviewTabFilter;
  onChange: (tab: InterviewTabFilter) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Interview filters"
      className="flex flex-wrap gap-2"
    >
      {INTERVIEW_TAB_FILTERS.map((tab) => {
        const active = value === tab;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab)}
            className={`rounded-[var(--radius-control)] px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
              active
                ? "bg-primary/10 text-primary"
                : "border border-border bg-card text-muted hover:text-text"
            }`}
          >
            {INTERVIEW_TAB_LABELS[tab]}
          </button>
        );
      })}
    </div>
  );
}
