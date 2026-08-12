"use client";

import { AuthInput } from "@/components/auth/AuthInput";
import { AuthSelect } from "@/components/auth/AuthSelect";
import { GENDER_OPTIONS } from "../data/profileOptions";
import type {
  CandidatePersonalInfo,
  ProfileFieldErrors,
} from "../types/profile.types";
import { SectionCard } from "./SectionCard";

export function PersonalInformationSection({
  value,
  editing,
  errors,
  touched,
  onChange,
  onBlurField,
}: {
  value: CandidatePersonalInfo;
  editing: boolean;
  errors: ProfileFieldErrors;
  touched: Partial<Record<keyof ProfileFieldErrors, boolean>>;
  onChange: (next: CandidatePersonalInfo) => void;
  onBlurField: (field: keyof ProfileFieldErrors) => void;
}) {
  const readOnly = !editing;

  return (
    <SectionCard
      title="Personal Information"
      description="Basic identity details used across your candidate profile."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <AuthInput
          label="First Name"
          value={value.firstName}
          disabled={readOnly}
          error={touched.firstName ? errors.firstName : undefined}
          onBlur={() => onBlurField("firstName")}
          onChange={(event) =>
            onChange({ ...value, firstName: event.target.value })
          }
        />
        <AuthInput
          label="Last Name"
          value={value.lastName}
          disabled={readOnly}
          error={touched.lastName ? errors.lastName : undefined}
          onBlur={() => onBlurField("lastName")}
          onChange={(event) =>
            onChange({ ...value, lastName: event.target.value })
          }
        />
        <div className="space-y-1.5 sm:col-span-2">
          <AuthInput
            label="Email"
            type="email"
            value={value.email}
            disabled
            readOnly
          />
          <p className="px-1 text-xs text-muted">
            Associated with your authenticated account. Contact support to
            change it.
          </p>
        </div>
        <AuthInput
          label="Phone"
          value={value.phone}
          disabled={readOnly}
          onChange={(event) =>
            onChange({ ...value, phone: event.target.value })
          }
        />
        <AuthInput
          label="Date of Birth"
          type="date"
          value={value.dateOfBirth}
          disabled={readOnly}
          onChange={(event) =>
            onChange({ ...value, dateOfBirth: event.target.value })
          }
        />
        <AuthSelect
          label="Gender"
          value={value.gender}
          disabled={readOnly}
          options={GENDER_OPTIONS}
          placeholder="Select gender"
          onChange={(event) =>
            onChange({
              ...value,
              gender: event.target.value as CandidatePersonalInfo["gender"],
            })
          }
        />
        <AuthInput
          label="Current Location"
          value={value.currentLocation}
          disabled={readOnly}
          error={touched.currentLocation ? errors.currentLocation : undefined}
          onBlur={() => onBlurField("currentLocation")}
          onChange={(event) =>
            onChange({ ...value, currentLocation: event.target.value })
          }
        />
        <AuthInput
          label="Preferred Location"
          value={value.preferredLocation}
          disabled={readOnly}
          onChange={(event) =>
            onChange({ ...value, preferredLocation: event.target.value })
          }
        />
      </div>
    </SectionCard>
  );
}
