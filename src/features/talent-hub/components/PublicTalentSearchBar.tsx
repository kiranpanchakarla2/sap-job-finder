"use client";

import { Filter, Search, X } from "lucide-react";

type PublicTalentSearchBarProps = {
  keyword: string;
  onKeywordChange: (val: string) => void;
  activeFilterCount: number;
  onOpenMobileFilters: () => void;
  selectedModules: string[];
  onToggleModule: (mod: string) => void;
};

const QUICK_MODULES = [
  "SAP FICO",
  "SAP S/4HANA",
  "SAP ABAP",
  "SAP BTP",
  "SAP MM",
  "SAP SD",
  "SAP SuccessFactors",
  "SAP Basis",
];

export function PublicTalentSearchBar({
  keyword,
  onKeywordChange,
  activeFilterCount,
  onOpenMobileFilters,
  selectedModules,
  onToggleModule,
}: PublicTalentSearchBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {/* Main Search Input */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="text"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="Search SAP skills, modules (e.g. FICO, BTP, ABAP), titles, or locations..."
            className="h-12 w-full rounded-[var(--radius-control)] border border-border bg-card pl-10 pr-9 text-sm text-text placeholder:text-muted shadow-soft focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 transition"
          />
          {keyword ? (
            <button
              type="button"
              onClick={() => onKeywordChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:bg-surface hover:text-text"
              aria-label="Clear keyword search"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        {/* Mobile Filter Trigger */}
        <button
          type="button"
          onClick={onOpenMobileFilters}
          className="flex h-12 items-center gap-2 rounded-[var(--radius-control)] border border-border bg-card px-4 text-xs font-semibold text-text shadow-soft hover:bg-surface lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          <Filter size={15} className="text-primary" aria-hidden="true" />
          <span>Filters</span>
          {activeFilterCount > 0 ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>

      {/* Quick Module Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted mr-1">
          Popular:
        </span>
        {QUICK_MODULES.map((mod) => {
          const active = selectedModules.includes(mod);
          return (
            <button
              key={mod}
              type="button"
              onClick={() => onToggleModule(mod)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                active
                  ? "border-primary bg-primary text-white"
                  : "border-border/80 bg-card text-muted hover:border-primary/40 hover:text-text"
              }`}
            >
              {mod}
            </button>
          );
        })}
      </div>
    </div>
  );
}
