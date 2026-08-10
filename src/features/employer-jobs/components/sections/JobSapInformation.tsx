"use client";

import type { UseFormReturn } from "react-hook-form";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthSelect } from "@/components/auth/AuthSelect";
import { INDUSTRY_OPTIONS } from "@/types/employer";
import { PROJECT_TYPE_OPTIONS, SAP_MODULE_OPTIONS } from "../../constants";
import type { JobFormValues } from "../../lib/validation";

export function JobSapInformation({
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
      <h2 className="text-base font-semibold text-text">SAP Information</h2>
      <p className="mt-1 text-sm text-muted">
        Help specialists find your role by module, specialization, and project type.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <AuthSelect
          label="SAP Module *"
          options={SAP_MODULE_OPTIONS}
          error={errors.sapModule?.message}
          {...register("sapModule")}
        />
        <AuthInput
          label="SAP Specialization"
          error={errors.sapSpecialization?.message}
          {...register("sapSpecialization")}
        />
        <AuthInput
          label="SAP Version"
          error={errors.sapVersion?.message}
          {...register("sapVersion")}
        />
        <AuthSelect
          label="Project Type"
          options={PROJECT_TYPE_OPTIONS}
          error={errors.projectType?.message}
          {...register("projectType")}
        />
        <div className="sm:col-span-2">
          <AuthSelect
            label="Industry"
            options={INDUSTRY_OPTIONS}
            error={errors.industry?.message}
            {...register("industry")}
          />
        </div>
      </div>
    </section>
  );
}
