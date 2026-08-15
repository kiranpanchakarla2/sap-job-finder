"use client";

import { Fragment } from "react";
import { Check, Minus } from "lucide-react";
import { CANDIDATE_COMPARISON_ROWS, CANDIDATE_PLAN_DEFINITIONS } from "../config/planRules";

function CellValue({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
        <Check size={16} className="text-success shrink-0" aria-hidden="true" />
        <span className="sr-only">Included</span>
        <span aria-hidden="true">Included</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-muted text-xs">
        <Minus size={16} className="shrink-0" aria-hidden="true" />
        <span className="sr-only">Not included</span>
        <span aria-hidden="true">—</span>
      </span>
    );
  }
  return <span className="font-medium text-xs sm:text-sm text-text">{value}</span>;
}

export function PlanComparison() {
  const plans = CANDIDATE_PLAN_DEFINITIONS;

  // Group rows by category
  const categories = Array.from(
    new Set(CANDIDATE_COMPARISON_ROWS.map((r) => r.category ?? "Features")),
  );

  return (
    <section
      aria-labelledby="plan-comparison-heading"
      className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft"
    >
      <div>
        <h2 id="plan-comparison-heading" className="text-lg font-bold tracking-tight text-text">
          Compare All Plans
        </h2>
        <p className="mt-1 text-xs text-muted">
          Detailed feature breakdown across Free, Professional, and Premium plans.
        </p>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-[42rem] w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <th scope="col" className="w-1/3 px-4 py-3.5 font-semibold text-left">
                Feature
              </th>
              {plans.map((plan) => (
                <th
                  key={plan.id}
                  scope="col"
                  className={`w-[22%] px-4 py-3.5 font-semibold text-left ${
                    plan.highlighted ? "text-primary" : "text-text"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{plan.name}</span>
                    {plan.badge && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        Popular
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => {
              const rowsInCategory = CANDIDATE_COMPARISON_ROWS.filter(
                (r) => (r.category ?? "Features") === category,
              );
              return (
                <Fragment key={category}>
                  <tr className="bg-surface/50">
                    <th
                      colSpan={4}
                      scope="colgroup"
                      className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-muted"
                    >
                      {category}
                    </th>
                  </tr>
                  {rowsInCategory.map((row) => (
                    <tr
                      key={row.label}
                      className="border-b border-border/60 transition hover:bg-surface/30 last:border-0"
                    >
                      <th
                        scope="row"
                        className="px-4 py-3 text-xs sm:text-sm font-medium text-text text-left font-normal"
                      >
                        {row.label}
                      </th>
                      {plans.map((plan) => (
                        <td
                          key={plan.id}
                          className={`px-4 py-3 text-xs sm:text-sm ${
                            plan.highlighted ? "bg-primary/[0.02]" : ""
                          }`}
                        >
                          <CellValue value={row.values[plan.id]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
