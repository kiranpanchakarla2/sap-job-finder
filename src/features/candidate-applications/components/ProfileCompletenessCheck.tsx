"use client";

import Link from "next/link";
import { Check, AlertTriangle } from "lucide-react";
import { useCandidateProfileCompletion } from "@/features/candidate-profile/hooks/useCandidateProfileCompletion";

export function ProfileCompletenessCheck() {
  const { percent, completion, isLoading } = useCandidateProfileCompletion();

  const label =
    percent >= 90 ? "Complete" : percent >= 70 ? "Almost complete" : "Needs attention";

  const categories = completion?.categories ?? [
    { label: "Personal Information", complete: false },
    { label: "SAP Skills & Experience", complete: false },
    { label: "Career & Employment", complete: false },
    { label: "Professional Summary", complete: false },
  ];

  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text">You&apos;re almost ready to apply</h2>
          <p className="mt-1 text-sm text-muted">
            Profile completeness {isLoading ? "..." : `${percent}%`} — {label}.
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {percent}%
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {categories.map((item) => (
          <li
            key={item.label}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface/50 px-3 py-2.5"
          >
            <span className="inline-flex items-center gap-2 text-sm text-text">
              {item.complete ? (
                <Check size={16} className="text-emerald-600" aria-hidden="true" />
              ) : (
                <AlertTriangle size={16} className="text-amber-600" aria-hidden="true" />
              )}
              {item.label}
            </span>
            {!item.complete ? (
              <Link
                href="/candidate/profile"
                className="text-xs font-semibold text-primary hover:text-accent"
              >
                Complete section
              </Link>
            ) : (
              <span className="text-xs font-medium text-emerald-700">Complete</span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">
        You can continue applying even if some optional profile details are incomplete.
      </p>
    </section>
  );
}
