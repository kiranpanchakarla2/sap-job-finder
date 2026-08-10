"use client";

import type { UseFormWatch } from "react-hook-form";
import type { JobFormValues } from "../lib/validation";

const CHECKPOINTS: { key: keyof JobFormValues; label: string }[] = [
  { key: "title", label: "Basic information" },
  { key: "sapModule", label: "SAP details" },
  { key: "description", label: "Job description" },
  { key: "minExperience", label: "Experience" },
  { key: "openings", label: "Hiring details" },
];

function isFilled(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  return String(value ?? "").trim().length > 0;
}

export function JobFormSummary({
  watch,
  mode,
}: {
  watch: UseFormWatch<JobFormValues>;
  mode: "create" | "edit";
}) {
  const values = watch();
  const completed = CHECKPOINTS.filter((item) => isFilled(values[item.key])).length;
  const progress = Math.round((completed / CHECKPOINTS.length) * 100);

  return (
    <aside className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft lg:sticky lg:top-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
        {mode === "create" ? "New posting" : "Editing job"}
      </p>
      <h2 className="mt-1 text-lg font-semibold text-text">Job Summary</h2>
      <p className="mt-1 text-sm text-muted">
        Track progress as you complete each section of the posting.
      </p>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold">
          <span className="text-muted">Progress</span>
          <span className="text-text">{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Form completion progress"
          />
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {CHECKPOINTS.map((item) => {
          const done = isFilled(values[item.key]);
          return (
            <li key={item.key} className="flex items-center gap-2 text-sm">
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                  done ? "bg-success/15 text-success" : "bg-surface text-muted"
                }`}
                aria-hidden="true"
              >
                {done ? "✓" : "•"}
              </span>
              <span className={done ? "text-text" : "text-muted"}>{item.label}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 space-y-2 rounded-2xl border border-border bg-surface/70 p-4 text-sm">
        <p className="font-semibold text-text">{values.title || "Untitled role"}</p>
        <p className="text-muted">{values.sapModule || "SAP module not selected"}</p>
        <p className="text-muted">{values.location || "Location not set"}</p>
        <p className="text-muted">
          {[values.employmentType, values.workArrangement].filter(Boolean).join(" · ") ||
            "Employment details pending"}
        </p>
      </div>
    </aside>
  );
}
