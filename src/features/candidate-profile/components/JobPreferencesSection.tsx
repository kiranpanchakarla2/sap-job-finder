"use client";

import { AuthInput } from "@/components/auth/AuthInput";
import { AuthSelect } from "@/components/auth/AuthSelect";
import {
  CAREER_LEVEL_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  JOB_ROLE_SUGGESTIONS,
  LOCATION_SUGGESTIONS,
  SAP_MODULE_CHIP_OPTIONS,
  WORK_MODE_OPTIONS,
} from "../data/profileOptions";
import type {
  CandidateJobPreferences,
  CareerLevel,
  EmploymentType,
} from "../types/profile.types";
import { SectionCard } from "./SectionCard";
import { SelectableChip } from "./TagChip";
import { TagInputField } from "./TagInputField";

function toggleInList<T extends string>(list: T[], item: T): T[] {
  return list.includes(item)
    ? list.filter((value) => value !== item)
    : [...list, item];
}

export function JobPreferencesSection({
  value,
  editing,
  onChange,
}: {
  value: CandidateJobPreferences;
  editing: boolean;
  onChange: (next: CandidateJobPreferences) => void;
}) {
  return (
    <SectionCard
      title="Job Preferences"
      description="Help us match you with the right SAP opportunities."
    >
      <div className="space-y-6">
        <TagInputField
          label="Preferred Job Roles"
          values={value.preferredJobRoles}
          suggestions={JOB_ROLE_SUGGESTIONS}
          disabled={!editing}
          onChange={(preferredJobRoles) =>
            onChange({ ...value, preferredJobRoles })
          }
        />

        <div>
          <p className="mb-3 text-sm font-medium text-text">
            Preferred SAP Modules
          </p>
          <div className="flex flex-wrap gap-2">
            {SAP_MODULE_CHIP_OPTIONS.map((module) => {
              const selected = value.preferredSapModules.includes(module);
              return (
                <SelectableChip
                  key={module}
                  label={module}
                  selected={selected}
                  disabled={!editing}
                  onToggle={() => {
                    if (!editing) return;
                    onChange({
                      ...value,
                      preferredSapModules: toggleInList(
                        value.preferredSapModules,
                        module,
                      ),
                    });
                  }}
                />
              );
            })}
          </div>
        </div>

        <TagInputField
          label="Preferred Locations"
          values={value.preferredLocations}
          suggestions={LOCATION_SUGGESTIONS}
          disabled={!editing}
          onChange={(preferredLocations) =>
            onChange({ ...value, preferredLocations })
          }
        />

        <div>
          <p className="mb-3 text-sm font-medium text-text">Work Mode</p>
          <div className="flex flex-wrap gap-2">
            {WORK_MODE_OPTIONS.map((mode) => {
              const selected = value.workModes.includes(mode);
              return (
                <SelectableChip
                  key={mode}
                  label={mode}
                  selected={selected}
                  disabled={!editing}
                  onToggle={() => {
                    if (!editing) return;
                    onChange({
                      ...value,
                      workModes: toggleInList(value.workModes, mode),
                    });
                  }}
                />
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-text">Employment Type</p>
          <div className="flex flex-wrap gap-2">
            {EMPLOYMENT_TYPE_OPTIONS.map((type) => {
              const selected = value.employmentTypes.includes(type);
              return (
                <SelectableChip
                  key={type}
                  label={type}
                  selected={selected}
                  disabled={!editing}
                  onToggle={() => {
                    if (!editing) return;
                    onChange({
                      ...value,
                      employmentTypes: toggleInList(
                        value.employmentTypes,
                        type as EmploymentType,
                      ),
                    });
                  }}
                />
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthInput
            label="Preferred Salary Range"
            value={value.preferredSalaryRange}
            disabled={!editing}
            onChange={(event) =>
              onChange({
                ...value,
                preferredSalaryRange: event.target.value,
              })
            }
          />
          <AuthSelect
            label="Career Level"
            value={value.careerLevel}
            disabled={!editing}
            options={CAREER_LEVEL_OPTIONS}
            placeholder="Select career level"
            onChange={(event) =>
              onChange({
                ...value,
                careerLevel: event.target.value as CareerLevel | "",
              })
            }
          />
        </div>
      </div>
    </SectionCard>
  );
}
