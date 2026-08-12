"use client";

import type { ProfileCompletionResult } from "../types/profile.types";
import { CompletionCheckItem } from "./TagChip";

export function ProfileCompletionCard({
  completion,
}: {
  completion: ProfileCompletionResult;
}) {
  const { percent, categories } = completion;

  return (
    <section
      className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft sm:p-6"
      aria-labelledby="profile-completion-heading"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            id="profile-completion-heading"
            className="text-sm font-semibold text-text"
          >
            Profile Completion
          </h2>
          <p className="mt-1 text-xs text-muted">
            Complete your profile to improve your SAP job matches.
          </p>
        </div>
        <span className="text-sm font-bold text-primary" aria-live="polite">
          {percent}%
        </span>
      </div>

      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-surface"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Profile completion progress"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((category) => (
          <CompletionCheckItem
            key={category.id}
            label={category.label}
            complete={category.complete}
          />
        ))}
      </ul>
    </section>
  );
}
