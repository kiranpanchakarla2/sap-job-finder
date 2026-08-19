"use client";

import { memo } from "react";
import { Search, X, RotateCcw } from "lucide-react";
import type { EmployerFilterState } from "../../types/employer.types";

type EmployerSearchFiltersProps = {
  filters: EmployerFilterState;
  onFilterChange: (next: Partial<EmployerFilterState>) => void;
  onReset: () => void;
  isLoading?: boolean;
};

export const EmployerSearchFilters = memo(function EmployerSearchFilters({
  filters,
  onFilterChange,
  onReset,
  isLoading = false,
}: EmployerSearchFiltersProps) {
  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.status !== "all" ||
    filters.subscription !== "all" ||
    filters.verification !== "all" ||
    filters.registrationDate !== "all";

  return (
    <div className="space-y-3 rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-soft">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Search Input */}
        <div className="relative sm:col-span-2 lg:col-span-2">
          <label htmlFor="employer-search-input" className="sr-only">
            Search employers
          </label>
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            id="employer-search-input"
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Search employers by company, email, recruiter..."
            className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-8 text-xs text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={isLoading}
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ search: "" })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-text"
              aria-label="Clear search query"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Account Status Filter */}
        <div>
          <label htmlFor="employer-status-filter" className="sr-only">
            Account Status
          </label>
          <select
            id="employer-status-filter"
            value={filters.status}
            onChange={(e) =>
              onFilterChange({
                status: e.target.value as EmployerFilterState["status"],
              })
            }
            className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-xs text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={isLoading}
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Subscription Filter */}
        <div>
          <label htmlFor="employer-sub-filter" className="sr-only">
            Subscription
          </label>
          <select
            id="employer-sub-filter"
            value={filters.subscription}
            onChange={(e) =>
              onFilterChange({
                subscription: e.target.value as EmployerFilterState["subscription"],
              })
            }
            className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-xs text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={isLoading}
          >
            <option value="all">Subscription: All</option>
            <option value="active">Active Sub</option>
            <option value="expired">Expired Sub</option>
            <option value="none">Free / None</option>
          </select>
        </div>

        {/* Verification Filter */}
        <div>
          <label htmlFor="employer-verif-filter" className="sr-only">
            Verification
          </label>
          <select
            id="employer-verif-filter"
            value={filters.verification}
            onChange={(e) =>
              onFilterChange({
                verification: e.target.value as EmployerFilterState["verification"],
              })
            }
            className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-xs text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={isLoading}
          >
            <option value="all">Verification: All</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </div>

      {/* Date Range & Reset Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="employer-date-filter" className="text-[11px] font-medium text-muted">
            Registration:
          </label>
          <select
            id="employer-date-filter"
            value={filters.registrationDate}
            onChange={(e) =>
              onFilterChange({
                registrationDate: e.target.value as EmployerFilterState["registrationDate"],
              })
            }
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-text focus:border-primary focus:outline-none"
            disabled={isLoading}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>

          {filters.registrationDate === "custom" && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={filters.customStart || ""}
                onChange={(e) => onFilterChange({ customStart: e.target.value })}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs text-text focus:border-primary focus:outline-none"
                aria-label="Start date"
              />
              <span className="text-xs text-muted">to</span>
              <input
                type="date"
                value={filters.customEnd || ""}
                onChange={(e) => onFilterChange({ customEnd: e.target.value })}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs text-text focus:border-primary focus:outline-none"
                aria-label="End date"
              />
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition"
          >
            <RotateCcw size={12} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
});
