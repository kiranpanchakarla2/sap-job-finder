"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import {
  EXPERIENCE_FILTER_OPTIONS,
  JOB_TYPE_OPTIONS,
  LOCATION_FILTER_OPTIONS,
  POSTED_DATE_OPTIONS,
  SALARY_FILTER_OPTIONS,
  SAP_MODULE_FILTER_OPTIONS,
  WORK_MODE_OPTIONS,
} from "../constants";
import type {
  EmploymentType,
  ExperienceFilterOption,
  JobSearchState,
  PostedDateFilter,
  SalaryFilterOption,
  WorkMode,
} from "../types/job.types";
import { countActiveFilters } from "../lib/filterJobs";

function toggleInList<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function CheckboxRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 text-sm text-text hover:bg-surface"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
      />
      <span>{label}</span>
    </label>
  );
}

export function JobFilterSidebar({
  state,
  onChange,
  onClear,
  className = "",
}: {
  state: JobSearchState;
  onChange: (next: JobSearchState) => void;
  onClear: () => void;
  className?: string;
}) {
  const activeCount = countActiveFilters(state);

  return (
    <aside
      className={`rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-soft ${className}`.trim()}
      aria-label="Job filters"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-text">
          Filters{activeCount ? ` (${activeCount})` : ""}
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-primary hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          Clear All
        </button>
      </div>

      <FilterSection title="Experience">
        {EXPERIENCE_FILTER_OPTIONS.map((option) => (
          <CheckboxRow
            key={option}
            id={`exp-${option}`}
            label={option}
            checked={state.experience.includes(option)}
            onChange={() =>
              onChange({
                ...state,
                experience: toggleInList<ExperienceFilterOption>(state.experience, option),
              })
            }
          />
        ))}
      </FilterSection>

      <FilterSection title="SAP Module">
        <div className="max-h-48 space-y-0.5 overflow-y-auto pr-1">
          {SAP_MODULE_FILTER_OPTIONS.map((option) => (
            <CheckboxRow
              key={option}
              id={`mod-${option}`}
              label={option}
              checked={state.sapModules.includes(option)}
              onChange={() =>
                onChange({
                  ...state,
                  sapModules: toggleInList(state.sapModules, option),
                })
              }
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Location">
        <div className="max-h-48 space-y-0.5 overflow-y-auto pr-1">
          {LOCATION_FILTER_OPTIONS.map((option) => (
            <CheckboxRow
              key={option}
              id={`loc-${option}`}
              label={option}
              checked={state.locations.includes(option)}
              onChange={() =>
                onChange({
                  ...state,
                  locations: toggleInList(state.locations, option),
                })
              }
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Work Mode">
        {WORK_MODE_OPTIONS.map((option) => (
          <CheckboxRow
            key={option}
            id={`wm-${option}`}
            label={option}
            checked={state.workModes.includes(option)}
            onChange={() =>
              onChange({
                ...state,
                workModes: toggleInList<WorkMode>(state.workModes, option),
              })
            }
          />
        ))}
      </FilterSection>

      <FilterSection title="Job Type">
        {JOB_TYPE_OPTIONS.map((option) => (
          <CheckboxRow
            key={option}
            id={`jt-${option}`}
            label={option}
            checked={state.jobTypes.includes(option)}
            onChange={() =>
              onChange({
                ...state,
                jobTypes: toggleInList<EmploymentType>(state.jobTypes, option),
              })
            }
          />
        ))}
      </FilterSection>

      <FilterSection title="Salary">
        {SALARY_FILTER_OPTIONS.map((option) => (
          <CheckboxRow
            key={option}
            id={`sal-${option}`}
            label={option}
            checked={state.salaryRanges.includes(option)}
            onChange={() =>
              onChange({
                ...state,
                salaryRanges: toggleInList<SalaryFilterOption>(state.salaryRanges, option),
              })
            }
          />
        ))}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="sal-min" className="mb-1 block text-[11px] text-muted">
              Min LPA
            </label>
            <input
              id="sal-min"
              type="number"
              min={0}
              value={state.salaryMinCustom ?? ""}
              onChange={(e) =>
                onChange({
                  ...state,
                  salaryMinCustom: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className="w-full rounded-[var(--radius-control)] border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label htmlFor="sal-max" className="mb-1 block text-[11px] text-muted">
              Max LPA
            </label>
            <input
              id="sal-max"
              type="number"
              min={0}
              value={state.salaryMaxCustom ?? ""}
              onChange={(e) =>
                onChange({
                  ...state,
                  salaryMaxCustom: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className="w-full rounded-[var(--radius-control)] border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Posted Date" last>
        <div className="space-y-1">
          {POSTED_DATE_OPTIONS.map((option) => (
            <label
              key={option.value}
              htmlFor={`posted-${option.value}`}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 text-sm text-text hover:bg-surface"
            >
              <input
                id={`posted-${option.value}`}
                type="radio"
                name="postedDate"
                checked={state.postedDate === option.value}
                onChange={() =>
                  onChange({
                    ...state,
                    postedDate: option.value as PostedDateFilter,
                  })
                }
                className="h-4 w-4 border-border text-primary focus:ring-primary/30"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>
    </aside>
  );
}

function FilterSection({
  title,
  children,
  last,
}: {
  title: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <section className={last ? "" : "mb-5 border-b border-border pb-5"}>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function JobFilterDrawer({
  open,
  onClose,
  state,
  onChange,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  state: JobSearchState;
  onChange: (next: JobSearchState) => void;
  onClear: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close filters"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-background shadow-lift">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-text">Filters</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            aria-label="Close filters"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <JobFilterSidebar state={state} onChange={onChange} onClear={onClear} />
        </div>
        <div className="border-t border-border p-4">
          <button
            type="button"
            onClick={onClose}
            className="theme-btn-primary inline-flex h-10 w-full items-center justify-center rounded-[var(--radius-button)] text-sm font-semibold text-button-fg"
          >
            Show results
          </button>
        </div>
      </div>
    </div>
  );
}
