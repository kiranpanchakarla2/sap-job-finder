"use client";

import type { JobSearchState } from "../types/job.types";

type JobSearchBarProps = {
  keyword: string;
  location: string;
  onKeywordChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onSearch: () => void;
};

export function JobSearchBar({
  keyword,
  location,
  onKeywordChange,
  onLocationChange,
  onSearch,
}: JobSearchBarProps) {
  return (
    <form
      className="rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-soft sm:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}
    >
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
        <div>
          <label htmlFor="job-keyword" className="mb-1.5 block text-xs font-semibold text-muted">
            Keyword
          </label>
          <input
            id="job-keyword"
            name="q"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="Search SAP jobs, skills, companies..."
            className="w-full rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label htmlFor="job-location" className="mb-1.5 block text-xs font-semibold text-muted">
            Location
          </label>
          <input
            id="job-location"
            name="location"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="City, state or remote"
            className="w-full rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="theme-btn-primary inline-flex h-[42px] w-full items-center justify-center rounded-[var(--radius-button)] px-5 text-sm font-semibold text-button-fg shadow-[var(--shadow-button)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring lg:min-w-[140px]"
          >
            Search Jobs
          </button>
        </div>
      </div>
    </form>
  );
}

export type DraftSearch = Pick<JobSearchState, "keyword" | "location">;
