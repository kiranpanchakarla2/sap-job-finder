"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Filter, RotateCcw, X } from "lucide-react";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { Button } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/NativeSelect";
import {
  APPLICATION_SORT_OPTIONS,
  APPLICATION_STATUS_FILTER_LABELS,
  APPLICATION_STATUS_FILTERS,
  EXPERIENCE_FILTER_OPTIONS,
} from "../constants";
import type {
  ApplicationSortOption,
  ApplicationStatusFilter,
  JobFilterOption,
} from "../types/application.types";
import { ApplicantSearch } from "./ApplicantSearch";

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
        active
          ? "bg-primary text-white shadow-soft"
          : "border border-border bg-card text-muted hover:border-primary/30 hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

const selectClassName =
  "h-10 rounded-xl border border-border bg-input px-3 text-sm font-medium text-input-fg outline-none transition focus:border-primary focus:shadow-[0_0_0_4px_rgba(79,70,229,0.12)]";

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[11px] font-semibold uppercase tracking-wide text-muted"
    >
      {children}
    </label>
  );
}

export function ApplicantFilters({
  search,
  status,
  sort,
  jobId,
  experience,
  location,
  jobOptions,
  locations,
  resultCount,
  statusLocked = false,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onJobChange,
  onExperienceChange,
  onLocationChange,
  onClearAll,
}: {
  search: string;
  status: ApplicationStatusFilter;
  sort: ApplicationSortOption;
  jobId: string;
  experience: string;
  location: string;
  jobOptions: JobFilterOption[];
  locations: string[];
  resultCount?: number;
  statusLocked?: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: ApplicationStatusFilter) => void;
  onSortChange: (sort: ApplicationSortOption) => void;
  onJobChange: (jobId: string) => void;
  onExperienceChange: (experience: string) => void;
  onLocationChange: (location: string) => void;
  onClearAll: () => void;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const titleId = useId();
  const jobSelectId = useId();
  const experienceSelectId = useId();
  const locationSelectId = useId();
  const sortSelectId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const activeFilterCount = [
    !statusLocked && status !== "all",
    Boolean(jobId),
    experience !== "all",
    Boolean(location),
    Boolean(search.trim()),
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0 || sort !== "newest";

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusables = panel ? getFocusableElements(panel) : [];
    window.requestAnimationFrame(() => {
      (focusables[0] ?? panel)?.focus({ preventScroll: true });
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (panel) trapFocus(event, panel);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const renderFilterFields = (prefix: string) => (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div>
        <FieldLabel htmlFor={`${prefix}-${jobSelectId}`}>Job</FieldLabel>
        <NativeSelect
          id={`${prefix}-${jobSelectId}`}
          value={jobId}
          onChange={(event) => onJobChange(event.target.value)}
          wrapperClassName="mt-2.5"
          className={selectClassName}
        >
          <option value="">All jobs</option>
          {jobOptions.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div>
        <FieldLabel htmlFor={`${prefix}-${experienceSelectId}`}>
          Experience
        </FieldLabel>
        <NativeSelect
          id={`${prefix}-${experienceSelectId}`}
          value={experience}
          onChange={(event) => onExperienceChange(event.target.value)}
          wrapperClassName="mt-2.5"
          className={selectClassName}
        >
          {EXPERIENCE_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div>
        <FieldLabel htmlFor={`${prefix}-${locationSelectId}`}>
          Location
        </FieldLabel>
        <NativeSelect
          id={`${prefix}-${locationSelectId}`}
          value={location}
          onChange={(event) => onLocationChange(event.target.value)}
          wrapperClassName="mt-2.5"
          className={selectClassName}
        >
          <option value="">All locations</option>
          {locations.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div>
        <FieldLabel htmlFor={`${prefix}-${sortSelectId}`}>Sort by</FieldLabel>
        <NativeSelect
          id={`${prefix}-${sortSelectId}`}
          value={sort}
          onChange={(event) =>
            onSortChange(event.target.value as ApplicationSortOption)
          }
          wrapperClassName="mt-2.5"
          className={selectClassName}
        >
          {APPLICATION_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      </div>
    </div>
  );

  return (
    <section
      aria-label="Search and filter applicants"
      className="rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-soft sm:p-5"
    >
      {/* Search row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <ApplicantSearch value={search} onChange={onSearchChange} />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {hasActiveFilters ? (
            <Button
              variant="ghost"
              className="!px-3 !py-2.5 text-xs"
              onClick={onClearAll}
            >
              <RotateCcw size={14} aria-hidden="true" />
              Clear all
            </Button>
          ) : null}

          <div className="lg:hidden">
            <Button
              variant="secondary"
              className="!px-3.5 !py-2.5"
              onClick={() => setOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls={panelId}
            >
              <Filter size={16} aria-hidden="true" />
              Filters
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
          </div>
        </div>
      </div>

      {/* Status chips */}
      {!statusLocked ? (
        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Status
          </p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
            {APPLICATION_STATUS_FILTERS.map((filter) => (
              <FilterChip
                key={filter}
                active={status === filter}
                onClick={() => onStatusChange(filter)}
              >
                {APPLICATION_STATUS_FILTER_LABELS[filter]}
              </FilterChip>
            ))}
          </div>
        </div>
      ) : null}

      {/* Desktop filter grid */}
      <div className="mt-4 hidden border-t border-border pt-4 lg:block">
        {renderFilterFields("desktop")}
      </div>

      {/* Result summary */}
      {typeof resultCount === "number" ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <p className="text-sm text-muted">
            Showing{" "}
            <span className="font-semibold text-text">{resultCount}</span>{" "}
            applicant{resultCount === 1 ? "" : "s"}
            {activeFilterCount > 0 ? " matching your filters" : ""}
          </p>
          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-semibold text-primary hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              Reset filters
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Mobile filter drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-[1.5rem] border border-border bg-card p-5 shadow-lift sm:rounded-[var(--radius-card)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id={titleId} className="text-base font-semibold text-text">
                Filters & sort
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                aria-label="Close filter panel"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="grid gap-4">{renderFilterFields("mobile")}</div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  onClearAll();
                }}
              >
                Clear all
              </Button>
              <Button onClick={() => setOpen(false)}>Show results</Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
