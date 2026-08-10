"use client";

import type { UseFormReturn } from "react-hook-form";
import { AuthTextarea } from "@/components/auth/AuthTextarea";
import type { JobFormValues } from "../../lib/validation";

export function JobDescriptionSection({
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
      <h2 className="text-base font-semibold text-text">Job Description</h2>
      <p className="mt-1 text-sm text-muted">
        Use short paragraphs or bullet lists (one item per line) for clarity.
      </p>

      <div className="mt-5 space-y-4">
        <AuthTextarea
          label="Job Description *"
          rows={5}
          error={errors.description?.message}
          {...register("description")}
        />
        <AuthTextarea
          label="Responsibilities *"
          rows={5}
          error={errors.responsibilities?.message}
          {...register("responsibilities")}
        />
        <AuthTextarea
          label="Required Skills *"
          rows={4}
          error={errors.requiredSkills?.message}
          {...register("requiredSkills")}
        />
        <AuthTextarea
          label="Preferred Skills"
          rows={3}
          error={errors.preferredSkills?.message}
          {...register("preferredSkills")}
        />
      </div>
    </section>
  );
}
