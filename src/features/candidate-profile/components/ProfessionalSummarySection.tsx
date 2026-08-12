"use client";

import { AuthTextarea } from "@/components/auth/AuthTextarea";
import { SUMMARY_MAX_CHARS } from "../data/profileOptions";
import { SectionCard } from "./SectionCard";

export function ProfessionalSummarySection({
  value,
  editing,
  onChange,
}: {
  value: string;
  editing: boolean;
  onChange: (next: string) => void;
}) {
  const length = value.length;
  const overLimit = length > SUMMARY_MAX_CHARS;

  return (
    <SectionCard
      title="Professional Summary"
      description="Tell employers about your professional experience, SAP expertise, and career goals."
    >
      <AuthTextarea
        label="Professional Summary"
        rows={5}
        value={value}
        disabled={!editing}
        maxLength={SUMMARY_MAX_CHARS + 50}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="mt-2 flex justify-end px-1">
        <p
          className={`text-xs font-medium ${
            overLimit ? "text-error" : "text-muted"
          }`}
          aria-live="polite"
        >
          {length}/{SUMMARY_MAX_CHARS}
        </p>
      </div>
    </SectionCard>
  );
}
