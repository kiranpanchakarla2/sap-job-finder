"use client";

import type { UseFormReturn } from "react-hook-form";
import { AuthInput } from "@/components/auth/AuthInput";
import type { JobFormValues } from "../../lib/validation";

export function JobHiringInformation({
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
      <h2 className="text-base font-semibold text-text">Hiring Information</h2>
      <p className="mt-1 text-sm text-muted">
        Set openings, deadline, and how candidates should apply.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <AuthInput
          label="Number of Openings *"
          type="number"
          min={1}
          step={1}
          error={errors.openings?.message}
          {...register("openings")}
        />
        <AuthInput
          label="Application Deadline"
          type="date"
          error={errors.deadline?.message}
          {...register("deadline")}
        />
        <AuthInput
          label="Recruiter"
          error={errors.recruiter?.message}
          {...register("recruiter")}
        />
        <AuthInput
          label="Application Email"
          type="email"
          error={errors.applicationEmail?.message}
          {...register("applicationEmail")}
        />
        <div className="sm:col-span-2">
          <AuthInput
            label="External Application URL"
            type="url"
            error={errors.externalUrl?.message}
            {...register("externalUrl")}
          />
        </div>
      </div>
    </section>
  );
}
