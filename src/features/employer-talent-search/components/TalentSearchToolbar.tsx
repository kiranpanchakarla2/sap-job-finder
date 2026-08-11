"use client";

import type { ReactNode } from "react";
import { LayoutGrid, List } from "lucide-react";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { SORT_OPTIONS } from "../config/talentSearchFilters";
import type { TalentSearchSort, TalentViewMode } from "../types/talentSearch.types";

export function TalentSearchToolbar({
  total,
  page,
  pageSize,
  sort,
  viewMode,
  onSortChange,
  onViewModeChange,
  filterButton,
}: {
  total: number;
  page: number;
  pageSize: number;
  sort: TalentSearchSort;
  viewMode: TalentViewMode;
  onSortChange: (sort: TalentSearchSort) => void;
  onViewModeChange: (mode: TalentViewMode) => void;
  filterButton?: ReactNode;
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        {filterButton}
        <p className="text-sm text-muted" aria-live="polite">
          {total === 0
            ? "0 candidates found"
            : `${start}–${end} of ${total} candidates found`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="talent-sort" className="sr-only">
          Sort candidates
        </label>
        <NativeSelect
          id="talent-sort"
          value={sort}
          onChange={(event) =>
            onSortChange(event.target.value as TalentSearchSort)
          }
          wrapperClassName="min-w-[12rem]"
          className="rounded-[var(--radius-control)] border border-border bg-input px-3 py-2 text-sm text-input-fg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>

        <div
          className="inline-flex rounded-[var(--radius-control)] border border-border bg-card p-1"
          role="group"
          aria-label="Result view"
        >
          <button
            type="button"
            aria-pressed={viewMode === "list"}
            aria-label="List view"
            onClick={() => onViewModeChange("list")}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
              viewMode === "list"
                ? "bg-primary/10 text-primary"
                : "text-muted hover:text-text"
            }`}
          >
            <List size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-pressed={viewMode === "grid"}
            aria-label="Grid view"
            onClick={() => onViewModeChange("grid")}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
              viewMode === "grid"
                ? "bg-primary/10 text-primary"
                : "text-muted hover:text-text"
            }`}
          >
            <LayoutGrid size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
