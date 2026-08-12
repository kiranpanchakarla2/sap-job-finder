"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatApplicationDate } from "../lib/applicationUtils";
import type { SelectableResume } from "../types/application.types";

export function ResumeSelector({
  resumes,
  selectedResumeId,
  onSelect,
  required,
}: {
  resumes: SelectableResume[];
  selectedResumeId: string | null;
  onSelect: (resumeId: string) => void;
  required: boolean;
}) {
  if (!resumes.length) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-card px-6 py-12 text-center">
        <h3 className="text-base font-semibold text-text">No resume available</h3>
        <p className="mt-1 text-sm text-muted">Upload a resume before applying.</p>
        <Button href="/candidate/resume" className="mt-5 !h-10">
          Upload Resume
        </Button>
      </div>
    );
  }

  const selected = resumes.find((resume) => resume.id === selectedResumeId) ?? null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text">Select Your Resume</h2>
        <p className="mt-1 text-sm text-muted">
          {required ? "A resume is required for this application." : "Resume is optional for this role."}
        </p>
      </div>

      <div className="grid gap-3">
        {resumes.map((resume) => {
          const active = resume.id === selectedResumeId;
          return (
            <button
              key={resume.id}
              type="button"
              onClick={() => onSelect(resume.id)}
              aria-pressed={active}
              className={`rounded-[var(--radius-card)] border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${
                active
                  ? "border-primary bg-primary/5 shadow-soft"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-text">{resume.label}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    Updated {formatApplicationDate(resume.updatedAt)} · {resume.fileName}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {resume.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-badge px-2.5 py-1 text-[11px] font-medium text-badge-fg"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    active ? "bg-primary text-white" : "bg-surface text-muted"
                  }`}
                >
                  {active ? "Selected" : "Select"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {selected ? (
        <div className="rounded-xl border border-border bg-surface/60 px-4 py-3">
          <p className="text-sm font-semibold text-text">Selected Resume</p>
          <p className="mt-0.5 text-sm text-muted">
            {selected.label} · Updated {formatApplicationDate(selected.updatedAt)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href="/candidate/resume"
              className="text-xs font-semibold text-primary hover:text-accent"
            >
              View Resume
            </Link>
            <button
              type="button"
              className="text-xs font-semibold text-muted hover:text-text"
              onClick={() => onSelect("")}
            >
              Change Resume
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
