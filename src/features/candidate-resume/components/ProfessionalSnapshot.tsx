"use client";

import { Award, Briefcase, Layers } from "lucide-react";
import type { ResumeCareerState } from "../types/resume.types";

export function ProfessionalSnapshot({
  state,
  sapSkills,
  certificationCount,
  totalExperienceLabel,
  sapExperienceLabel,
}: {
  state: ResumeCareerState;
  sapSkills: string[];
  certificationCount: number;
  totalExperienceLabel: string;
  sapExperienceLabel: string;
}) {
  const chips = [
    totalExperienceLabel,
    sapExperienceLabel,
    ...sapSkills.slice(0, 4),
    `${certificationCount} Certification${certificationCount === 1 ? "" : "s"}`,
    `${state.experience.length} Role${state.experience.length === 1 ? "" : "s"}`,
  ].filter(Boolean);

  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft sm:p-6">
      <div className="flex items-center gap-2">
        <Layers size={18} className="text-primary" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-text">Professional Snapshot</h3>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
          >
            {chip.includes("Certification") ? (
              <Award size={12} aria-hidden="true" />
            ) : chip.includes("Role") ? (
              <Briefcase size={12} aria-hidden="true" />
            ) : null}
            {chip}
          </span>
        ))}
      </div>
    </section>
  );
}
