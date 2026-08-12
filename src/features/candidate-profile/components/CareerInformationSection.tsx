"use client";

import { AuthInput } from "@/components/auth/AuthInput";
import { AuthSelect } from "@/components/auth/AuthSelect";
import {
  EMPLOYMENT_STATUS_OPTIONS,
  EXPERIENCE_SELECT_OPTIONS,
  NOTICE_PERIOD_OPTIONS,
} from "../data/profileOptions";
import type {
  CandidateCareerInfo,
  ProfileFieldErrors,
} from "../types/profile.types";
import { SectionCard } from "./SectionCard";

export function CareerInformationSection({
  value,
  editing,
  errors,
  touched,
  onChange,
  onBlurField,
}: {
  value: CandidateCareerInfo;
  editing: boolean;
  errors: ProfileFieldErrors;
  touched: Partial<Record<keyof ProfileFieldErrors, boolean>>;
  onChange: (next: CandidateCareerInfo) => void;
  onBlurField: (field: keyof ProfileFieldErrors) => void;
}) {
  const readOnly = !editing;

  return (
    <SectionCard
      title="Career Information"
      description="Your current role and experience for better SAP job matching."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <AuthInput
          label="Current Job Title"
          value={value.currentJobTitle}
          disabled={readOnly}
          error={touched.currentJobTitle ? errors.currentJobTitle : undefined}
          onBlur={() => onBlurField("currentJobTitle")}
          onChange={(event) =>
            onChange({ ...value, currentJobTitle: event.target.value })
          }
        />
        <AuthInput
          label="Current Company"
          value={value.currentCompany}
          disabled={readOnly}
          onChange={(event) =>
            onChange({ ...value, currentCompany: event.target.value })
          }
        />
        <AuthSelect
          label="Total Experience"
          value={value.totalExperience}
          disabled={readOnly}
          options={EXPERIENCE_SELECT_OPTIONS}
          placeholder="Select experience"
          onChange={(event) =>
            onChange({ ...value, totalExperience: event.target.value })
          }
        />
        <AuthSelect
          label="Relevant SAP Experience"
          value={value.relevantSapExperience}
          disabled={readOnly}
          options={EXPERIENCE_SELECT_OPTIONS}
          placeholder="Select SAP experience"
          onChange={(event) =>
            onChange({ ...value, relevantSapExperience: event.target.value })
          }
        />
        <AuthSelect
          label="Notice Period"
          value={value.noticePeriod}
          disabled={readOnly}
          options={NOTICE_PERIOD_OPTIONS}
          placeholder="Select notice period"
          onChange={(event) =>
            onChange({ ...value, noticePeriod: event.target.value })
          }
        />
        <AuthSelect
          label="Employment Status"
          value={value.employmentStatus}
          disabled={readOnly}
          options={EMPLOYMENT_STATUS_OPTIONS}
          placeholder="Select status"
          onChange={(event) =>
            onChange({
              ...value,
              employmentStatus: event.target
                .value as CandidateCareerInfo["employmentStatus"],
            })
          }
        />
        <AuthInput
          label="Expected Salary"
          value={value.expectedSalary}
          disabled={readOnly}
          onChange={(event) =>
            onChange({ ...value, expectedSalary: event.target.value })
          }
        />
        <AuthInput
          label="Current Salary"
          value={value.currentSalary}
          disabled={readOnly}
          onChange={(event) =>
            onChange({ ...value, currentSalary: event.target.value })
          }
        />
      </div>
    </SectionCard>
  );
}
