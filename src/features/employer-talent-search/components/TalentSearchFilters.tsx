"use client";

import { Button } from "@/components/ui/Button";
import {
  AVAILABILITY_OPTIONS,
  CANDIDATE_STATUS_OPTIONS,
  CERTIFICATION_OPTIONS,
  COUNTRY_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  EXPERIENCE_BAND_OPTIONS,
  LANGUAGE_OPTIONS,
  SAP_MODULE_OPTIONS,
  SKILL_OPTIONS,
  WORK_MODE_OPTIONS,
} from "../config/talentSearchFilters";
import type { TalentSearchFilters } from "../types/talentSearch.types";
import { FilterCheckboxGroup } from "./FilterCheckboxGroup";

export function TalentSearchFiltersPanel({
  filters,
  onChange,
  onClear,
  onApply,
  showApply = false,
}: {
  filters: TalentSearchFilters;
  onChange: (patch: Partial<TalentSearchFilters>) => void;
  onClear: () => void;
  onApply?: () => void;
  showApply?: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="space-y-5 overflow-y-auto p-4">
        <FilterCheckboxGroup
          legend="SAP Modules"
          options={SAP_MODULE_OPTIONS}
          values={filters.modules}
          onChange={(modules) => onChange({ modules })}
        />
        <FilterCheckboxGroup
          legend="Skills"
          options={SKILL_OPTIONS}
          values={filters.skills}
          onChange={(skills) => onChange({ skills })}
        />
        <FilterCheckboxGroup
          legend="Experience"
          options={EXPERIENCE_BAND_OPTIONS}
          values={filters.experienceBands}
          onChange={(experienceBands) => onChange({ experienceBands })}
        />
        <div>
          <label
            htmlFor="talent-experience-min"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted"
          >
            Minimum years
          </label>
          <input
            id="talent-experience-min"
            type="number"
            min={0}
            max={40}
            value={filters.experienceMin ?? ""}
            onChange={(event) => {
              const raw = event.target.value;
              onChange({
                experienceMin: raw === "" ? null : Math.max(0, Number(raw)),
              });
            }}
            placeholder="e.g. 5"
            className="w-full rounded-[var(--radius-control)] border border-border bg-input px-3 py-2 text-sm text-input-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          />
        </div>
        <FilterCheckboxGroup
          legend="Country"
          options={COUNTRY_OPTIONS}
          values={filters.countries}
          onChange={(countries) => onChange({ countries })}
        />
        <div>
          <label
            htmlFor="talent-location-query"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted"
          >
            City / Location
          </label>
          <input
            id="talent-location-query"
            type="search"
            value={filters.locationQuery}
            onChange={(event) => onChange({ locationQuery: event.target.value })}
            placeholder="City or region"
            className="w-full rounded-[var(--radius-control)] border border-border bg-input px-3 py-2 text-sm text-input-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          />
        </div>
        <FilterCheckboxGroup
          legend="Work Mode"
          options={WORK_MODE_OPTIONS}
          values={filters.workModes}
          onChange={(workModes) => onChange({ workModes })}
        />
        <FilterCheckboxGroup
          legend="Employment Type"
          options={EMPLOYMENT_TYPE_OPTIONS}
          values={filters.employmentTypes}
          onChange={(employmentTypes) => onChange({ employmentTypes })}
        />
        <FilterCheckboxGroup
          legend="Availability"
          options={AVAILABILITY_OPTIONS}
          values={filters.availability}
          onChange={(availability) => onChange({ availability })}
        />
        <FilterCheckboxGroup
          legend="Candidate Status"
          options={CANDIDATE_STATUS_OPTIONS}
          values={filters.candidateStatus}
          onChange={(candidateStatus) => onChange({ candidateStatus })}
        />
        <FilterCheckboxGroup
          legend="Certifications"
          options={CERTIFICATION_OPTIONS}
          values={filters.certifications}
          onChange={(certifications) => onChange({ certifications })}
        />
        <FilterCheckboxGroup
          legend="Languages"
          options={LANGUAGE_OPTIONS}
          values={filters.languages}
          onChange={(languages) => onChange({ languages })}
        />
      </div>

      <div className="sticky bottom-0 mt-auto flex gap-2 border-t border-border bg-card p-4">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClear}>
          Clear All
        </Button>
        {showApply && onApply ? (
          <Button type="button" className="flex-1" onClick={onApply}>
            Apply Filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
