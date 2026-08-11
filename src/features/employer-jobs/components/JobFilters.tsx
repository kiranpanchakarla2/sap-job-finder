"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Filter, X } from "lucide-react";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { Button } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { JOB_SORT_OPTIONS, JOB_STATUS_FILTERS } from "../constants";
import type { JobSortOption, JobStatusFilter } from "../types/job.types";

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
      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
        active
          ? "bg-primary text-white shadow-soft"
          : "border border-border bg-card text-muted hover:border-primary/30 hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

export function JobFilters({
  status,
  sort,
  onStatusChange,
  onSortChange,
}: {
  status: JobStatusFilter;
  sort: JobSortOption;
  onStatusChange: (status: JobStatusFilter) => void;
  onSortChange: (sort: JobSortOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

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

  return (
    <>
      <div className="hidden flex-wrap items-center gap-2 md:flex">
        {JOB_STATUS_FILTERS.map((filter) => (
          <FilterChip
            key={filter}
            active={status === filter}
            onClick={() => onStatusChange(filter)}
          >
            {filter}
          </FilterChip>
        ))}
        <label className="ml-2 inline-flex items-center gap-2 text-xs text-muted">
          <span className="font-semibold uppercase tracking-wide">Sort by</span>
          <NativeSelect
            value={sort}
            onChange={(event) => onSortChange(event.target.value as JobSortOption)}
            className="h-9 rounded-xl border border-border bg-input px-3 text-sm font-medium text-input-fg outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(79,70,229,0.12)]"
          >
            {JOB_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </label>
      </div>

      <div className="md:hidden">
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
          {status !== "All" ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
              {status}
            </span>
          ) : null}
        </Button>

        {open ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
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
              className="relative z-10 w-full max-w-md rounded-t-[1.5rem] border border-border bg-card p-5 shadow-lift sm:rounded-[var(--radius-card)]"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 id={titleId} className="text-base font-semibold text-text">
                  Filter jobs
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

              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Status
              </p>
              <div className="flex flex-wrap gap-2">
                {JOB_STATUS_FILTERS.map((filter) => (
                  <FilterChip
                    key={filter}
                    active={status === filter}
                    onClick={() => onStatusChange(filter)}
                  >
                    {filter}
                  </FilterChip>
                ))}
              </div>

              <label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-muted">
                Sort by
                <NativeSelect
                  value={sort}
                  onChange={(event) =>
                    onSortChange(event.target.value as JobSortOption)
                  }
                  wrapperClassName="mt-2.5"
                  className="h-11 rounded-2xl border border-border bg-input px-3 text-sm font-medium text-input-fg outline-none focus:border-primary"
                >
                  {JOB_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </NativeSelect>
              </label>

              <Button className="mt-5 w-full" onClick={() => setOpen(false)}>
                Apply filters
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
