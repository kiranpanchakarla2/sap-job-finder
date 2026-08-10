"use client";

import type { UseFormReturn } from "react-hook-form";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthSelect } from "@/components/auth/AuthSelect";
import {
  EMPLOYMENT_TYPE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  JOB_TYPE_OPTIONS,
  WORK_ARRANGEMENT_OPTIONS,
} from "../../constants";
import type { JobFormValues } from "../../lib/validation";

export function JobBasicInformation({
  form,
}: {
  form: UseFormReturn<JobFormValues>;
}) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft sm:p-6">
      <h2 className="text-base font-semibold text-text">Basic Information</h2>
      <p className="mt-1 text-sm text-muted">
        Core details candidates see first when browsing your opportunity.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <AuthInput
            label="Job Title *"
            error={errors.title?.message}
            {...register("title")}
          />
        </div>
        <AuthSelect
          label="Employment Type *"
          options={EMPLOYMENT_TYPE_OPTIONS}
          error={errors.employmentType?.message}
          {...register("employmentType")}
        />
        <AuthSelect
          label="Job Type *"
          options={JOB_TYPE_OPTIONS}
          error={errors.jobType?.message}
          {...register("jobType")}
        />
        <AuthSelect
          label="Experience Level *"
          options={EXPERIENCE_LEVEL_OPTIONS}
          error={errors.experienceLevel?.message}
          {...register("experienceLevel")}
        />
        <AuthSelect
          label="Work Arrangement *"
          options={WORK_ARRANGEMENT_OPTIONS}
          error={errors.workArrangement?.message}
          {...register("workArrangement")}
        />
        <div className="sm:col-span-2">
          <AuthInput
            label="Location *"
            error={errors.location?.message}
            {...register("location")}
          />
        </div>
      </div>
    </section>
  );
}
