"use client";

import { Bookmark } from "lucide-react";
import { useSavedJobs } from "../context/SavedJobsProvider";

export function SaveJobButton({
  jobId,
  variant = "icon",
  className = "",
}: {
  jobId: string;
  variant?: "icon" | "button";
  className?: string;
}) {
  const { isSaved, toggleSave } = useSavedJobs();
  const saved = isSaved(jobId);
  const label = saved ? "Remove saved job" : "Save job";

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={() => toggleSave(jobId)}
        aria-pressed={saved}
        aria-label={label}
        className={`inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-border bg-button-secondary px-4 text-sm font-semibold text-button-secondary-fg transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${className}`.trim()}
      >
        <Bookmark
          size={16}
          aria-hidden="true"
          className={saved ? "fill-primary text-primary" : ""}
        />
        {saved ? "Saved" : "Save Job"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSave(jobId);
      }}
      aria-pressed={saved}
      aria-label={label}
      className={`shrink-0 rounded-lg p-2 text-muted transition hover:bg-surface hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${className}`.trim()}
    >
      <Bookmark
        size={18}
        aria-hidden="true"
        className={saved ? "fill-primary text-primary" : ""}
      />
    </button>
  );
}
