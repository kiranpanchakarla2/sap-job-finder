"use client";

import { ArrowUpDown, LayoutGrid, List, X } from "lucide-react";
import type {
  PublicTalentSearchFilters,
  PublicTalentSort,
} from "../types/publicTalent.types";

type PublicTalentToolbarProps = {
  total: number;
  sort: PublicTalentSort;
  onSortChange: (sort: PublicTalentSort) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  filters: PublicTalentSearchFilters;
  onRemoveFilter: (key: keyof PublicTalentSearchFilters, value?: string) => void;
};

export function PublicTalentToolbar({
  total,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  filters,
  onRemoveFilter,
}: PublicTalentToolbarProps) {
  const activeChips: { key: keyof PublicTalentSearchFilters; label: string; value?: string }[] = [];

  if (filters.keyword) {
    activeChips.push({
      key: "keyword",
      label: `Keyword: "${filters.keyword}"`,
    });
  }

  if (filters.type) {
    activeChips.push({
      key: "type",
      label: `Role: ${filters.type}`,
    });
  }

  filters.modules.forEach((mod) => {
    activeChips.push({
      key: "modules",
      label: mod,
      value: mod,
    });
  });

  filters.experienceBands.forEach((band) => {
    activeChips.push({
      key: "experienceBands",
      label: `${band} Yrs`,
      value: band,
    });
  });

  filters.workModes.forEach((mode) => {
    activeChips.push({
      key: "workModes",
      label: mode.charAt(0).toUpperCase() + mode.slice(1),
      value: mode,
    });
  });

  filters.locations.forEach((loc) => {
    activeChips.push({
      key: "locations",
      label: loc,
      value: loc,
    });
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <p className="text-xs sm:text-sm font-semibold text-text">
          Showing <span className="text-primary font-bold">{total}</span> SAP talent profile{total === 1 ? "" : "s"}
        </p>

        <div className="flex items-center gap-3">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <ArrowUpDown size={14} className="text-primary" aria-hidden="true" />
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as PublicTalentSort)}
              className="h-9 rounded-lg border border-border bg-card px-2 text-xs font-medium text-text shadow-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="Sort talent by"
            >
              <option value="relevance">Most Relevant</option>
              <option value="experience_high">Highest Experience</option>
              <option value="experience_low">Lowest Experience</option>
              <option value="available_soon">Available Immediately</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="hidden sm:flex items-center rounded-lg border border-border bg-card p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={`rounded p-1.5 transition ${
                viewMode === "grid"
                  ? "bg-primary text-white"
                  : "text-muted hover:text-text"
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              className={`rounded p-1.5 transition ${
                viewMode === "list"
                  ? "bg-primary text-white"
                  : "text-muted hover:text-text"
              }`}
              aria-label="List view"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeChips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted mr-1">
            Active Filters:
          </span>
          {activeChips.map((chip, idx) => (
            <span
              key={`${chip.key}-${chip.value || idx}`}
              className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={() => onRemoveFilter(chip.key, chip.value)}
                className="rounded-full p-0.5 hover:bg-primary/20 text-primary"
                aria-label={`Remove filter ${chip.label}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
