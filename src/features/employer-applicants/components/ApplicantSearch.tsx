"use client";

import { Search, X } from "lucide-react";

export function ApplicantSearch({
  value,
  onChange,
  id = "applicant-search",
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}) {
  return (
    <div className="relative w-full">
      <label htmlFor={id} className="sr-only">
        Search applicants by name, job, skills, or email
      </label>
      <Search
        size={16}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by name, job, skills, or email…"
        className="h-11 w-full rounded-2xl border border-border bg-input py-2 pl-10 pr-10 text-sm font-medium text-input-fg outline-none transition placeholder:text-muted focus:border-primary focus:shadow-[0_0_0_4px_rgba(79,70,229,0.12)]"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition hover:bg-surface hover:text-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          aria-label="Clear search"
        >
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
