"use client";

import type { UseFormReturn } from "react-hook-form";
import { AuthInput } from "@/components/auth/AuthInput";
import type { JobFormValues } from "../../lib/validation";

export function JobExperienceSection({
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
      <h2 className="text-base font-semibold text-text">Experience</h2>
      <p className="mt-1 text-sm text-muted">
        Leave maximum blank to show an open-ended range like “10+ years”.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <AuthInput
          label="Minimum Experience (years) *"
          type="number"
          min={0}
          step={1}
          error={errors.minExperience?.message}
          {...register("minExperience")}
        />
        <AuthInput
          label="Maximum Experience (years)"
          type="number"
          min={0}
          step={1}
          error={errors.maxExperience?.message}
          {...register("maxExperience")}
        />
      </div>
    </section>
  );
}
