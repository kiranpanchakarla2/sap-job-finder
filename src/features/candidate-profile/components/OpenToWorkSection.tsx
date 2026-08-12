"use client";

import { Sparkles } from "lucide-react";
import { AuthSelect } from "@/components/auth/AuthSelect";
import { SettingsToggle } from "@/features/employer-settings/components/SettingsToggle";
import {
  AVAILABILITY_OPTIONS,
  JOB_ROLE_SUGGESTIONS,
  LOCATION_SUGGESTIONS,
  WORK_MODE_OPTIONS,
} from "../data/profileOptions";
import type { CandidateOpenToWork, WorkMode } from "../types/profile.types";
import { SelectableChip } from "./TagChip";
import { TagInputField } from "./TagInputField";

function toggleInList<T extends string>(list: T[], item: T): T[] {
  return list.includes(item)
    ? list.filter((value) => value !== item)
    : [...list, item];
}

export function OpenToWorkSection({
  value,
  editing,
  onChange,
}: {
  value: CandidateOpenToWork;
  editing: boolean;
  onChange: (next: CandidateOpenToWork) => void;
}) {
  return (
    <section
      className={`rounded-[var(--radius-card)] border p-5 shadow-soft sm:p-6 ${
        value.enabled
          ? "border-primary/30 bg-primary/[0.04]"
          : "border-border bg-card"
      }`}
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles size={18} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-text">Open to Work</h2>
          <p className="mt-1 text-sm text-muted">
            Let recruiters know that you&apos;re currently open to relevant
            opportunities.
          </p>
        </div>
      </div>

      <SettingsToggle
        label="I'm open to new SAP opportunities"
        description="Visible to employers browsing candidate profiles."
        checked={value.enabled}
        disabled={!editing}
        onChange={(enabled) => onChange({ ...value, enabled })}
      />

      {value.enabled ? (
        <div className="mt-5 space-y-5 border-t border-border/70 pt-5">
          <TagInputField
            label="Preferred Job Roles"
            values={value.preferredJobRoles}
            suggestions={JOB_ROLE_SUGGESTIONS}
            disabled={!editing}
            onChange={(preferredJobRoles) =>
              onChange({ ...value, preferredJobRoles })
            }
          />
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
            <p className="mb-3 text-sm font-medium text-text">
              Preferred Work Mode
            </p>
            <div className="flex flex-wrap gap-2">
              {WORK_MODE_OPTIONS.map((mode) => {
                const selected = value.preferredWorkModes.includes(mode);
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
                        preferredWorkModes: toggleInList(
                          value.preferredWorkModes,
                          mode as WorkMode,
                        ),
                      });
                    }}
                  />
                );
              })}
            </div>
          </div>
          <AuthSelect
            label="Availability"
            value={value.availability}
            disabled={!editing}
            options={AVAILABILITY_OPTIONS}
            placeholder="Select availability"
            onChange={(event) =>
              onChange({ ...value, availability: event.target.value })
            }
          />
        </div>
      ) : null}
    </section>
  );
}
