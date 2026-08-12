"use client";

import {
  SAP_MODULE_CHIP_OPTIONS,
  TECHNICAL_SKILL_SUGGESTIONS,
} from "../data/profileOptions";
import type { CandidateSapExpertise } from "../types/profile.types";
import { SectionCard } from "./SectionCard";
import { SelectableChip } from "./TagChip";
import { TagInputField } from "./TagInputField";

export function SapExpertiseSection({
  value,
  editing,
  onChange,
}: {
  value: CandidateSapExpertise;
  editing: boolean;
  onChange: (next: CandidateSapExpertise) => void;
}) {
  const toggleModule = (module: string) => {
    const selected = value.modules.includes(module);
    const modules = selected
      ? value.modules.filter((item) => item !== module)
      : [...value.modules, module];

    const moduleExperience = selected
      ? value.moduleExperience.filter((item) => item.module !== module)
      : [
          ...value.moduleExperience,
          { module, years: 1 },
        ];

    onChange({ ...value, modules, moduleExperience });
  };

  const updateYears = (module: string, years: number) => {
    onChange({
      ...value,
      moduleExperience: value.moduleExperience.map((item) =>
        item.module === module ? { ...item, years } : item,
      ),
    });
  };

  return (
    <SectionCard
      title="SAP Expertise"
      description="Highlight the SAP modules and technical skills that define your profile."
    >
      <div className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-medium text-text">SAP Modules</p>
          <div className="flex flex-wrap gap-2">
            {SAP_MODULE_CHIP_OPTIONS.map((module) => {
              const selected = value.modules.includes(module);
              return (
                <SelectableChip
                  key={module}
                  label={module}
                  selected={selected}
                  disabled={!editing}
                  onToggle={() => {
                    if (editing) toggleModule(module);
                  }}
                />
              );
            })}
          </div>
        </div>

        <TagInputField
          label="Technical Skills"
          values={value.technicalSkills}
          suggestions={TECHNICAL_SKILL_SUGGESTIONS}
          disabled={!editing}
          onChange={(technicalSkills) =>
            onChange({ ...value, technicalSkills })
          }
        />

        {value.moduleExperience.length ? (
          <div>
            <p className="mb-3 text-sm font-medium text-text">
              Years of Experience
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {value.moduleExperience.map((item) => (
                <label
                  key={item.module}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/50 px-3 py-2.5"
                >
                  <span className="text-sm font-medium text-text">
                    {item.module}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    step={0.5}
                    disabled={!editing}
                    value={item.years}
                    aria-label={`${item.module} years of experience`}
                    onChange={(event) =>
                      updateYears(
                        item.module,
                        Math.max(0, Number(event.target.value) || 0),
                      )
                    }
                    className="h-9 w-20 rounded-lg border border-border bg-input px-2 text-sm text-input-fg outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(79,70,229,0.12)] disabled:opacity-70"
                  />
                </label>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
