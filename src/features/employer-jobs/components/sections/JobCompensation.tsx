"use client";

import type { UseFormReturn } from "react-hook-form";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthSelect } from "@/components/auth/AuthSelect";
import {
  BENEFIT_OPTIONS,
  CURRENCY_OPTIONS,
  SALARY_TYPE_OPTIONS,
} from "../../constants";
import type { BenefitOption } from "../../types/job.types";
import type { JobFormValues } from "../../lib/validation";

export function JobCompensation({
  form,
}: {
  form: UseFormReturn<JobFormValues>;
}) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const benefits = watch("benefits") ?? [];
  const salaryVisibility = watch("salaryVisibility");

  const toggleBenefit = (benefit: BenefitOption) => {
    const next = benefits.includes(benefit)
      ? benefits.filter((item) => item !== benefit)
      : [...benefits, benefit];
    setValue("benefits", next, { shouldDirty: true });
  };

  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft sm:p-6">
      <h2 className="text-base font-semibold text-text">Compensation</h2>
      <p className="mt-1 text-sm text-muted">
        Optional salary details and benefits that make your offer stand out.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <AuthSelect
          label="Salary Type"
          options={SALARY_TYPE_OPTIONS}
          error={errors.salaryType?.message}
          {...register("salaryType")}
        />
        <AuthSelect
          label="Currency"
          options={CURRENCY_OPTIONS}
          error={errors.currency?.message}
          {...register("currency")}
        />
        <AuthInput
          label="Minimum Salary"
          type="number"
          min={0}
          error={errors.minSalary?.message}
          {...register("minSalary")}
        />
        <AuthInput
          label="Maximum Salary"
          type="number"
          min={0}
          error={errors.maxSalary?.message}
          {...register("maxSalary")}
        />
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-text">Salary visibility</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              { value: "show", label: "Show salary" },
              { value: "hide", label: "Hide salary" },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                salaryVisibility === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-muted hover:text-text"
              }`}
            >
              <input
                type="radio"
                value={option.value}
                className="sr-only"
                {...register("salaryVisibility")}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-text">Benefits</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {BENEFIT_OPTIONS.map((benefit) => {
            const selected = benefits.includes(benefit);
            return (
              <button
                key={benefit}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleBenefit(benefit)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface text-muted hover:text-text"
                }`}
              >
                {benefit}
              </button>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
}
