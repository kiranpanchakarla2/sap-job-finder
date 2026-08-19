"use client";

import {
  Briefcase,
  Clock,
  Eye,
  GraduationCap,
  Lock,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import type { PublicTalentCandidate } from "../types/publicTalent.types";

type PublicTalentCardProps = {
  candidate: PublicTalentCandidate;
  onPreview: (candidate: PublicTalentCandidate) => void;
};

export function PublicTalentCard({ candidate, onPreview }: PublicTalentCardProps) {
  const availabilityLabels: Record<string, string> = {
    available_now: "Available Now",
    within_2_weeks: "Within 2 Weeks",
    within_1_month: "Within 1 Month",
    exploring: "Open to Opps",
  };

  const workModeLabels: Record<string, string> = {
    remote: "Remote",
    hybrid: "Hybrid",
    onsite: "On-site",
  };

  return (
    <article
      onClick={() => onPreview(candidate)}
      className="group relative flex flex-col justify-between rounded-[var(--radius-card)] border border-border bg-card p-5 sm:p-6 shadow-soft transition-all duration-200 hover:border-primary/50 hover:shadow-lift cursor-pointer pt-12 sm:pt-13"
    >
      {/* 3D Folded Ribbon Flag on Left Edge (Matching Reference) */}
      <div className="absolute top-3.5 -left-2 z-10 select-none pointer-events-none">
        <div className="relative flex items-center gap-1.5 bg-emerald-600 text-white pl-2 pr-2.5 py-1 rounded-r shadow-sm text-[10px] font-extrabold uppercase tracking-wider">
          <ShieldCheck size={13} className="stroke-[2.5] text-white shrink-0" aria-hidden="true" />
          <span>VERIFIED</span>
          {/* Folded 3D corner shadow wrapping under the card border */}
          <span
            className="absolute left-0 -bottom-2 h-0 w-0 border-t-[8px] border-t-emerald-900 border-l-[8px] border-l-transparent"
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="space-y-4">
        {/* Full-Width Candidate Professional Job Title */}
        <div className="pt-1">
          <h3 className="text-base sm:text-lg font-bold leading-snug text-text group-hover:text-primary transition-colors line-clamp-2">
            {candidate.title}
          </h3>

          {/* Availability Status & Meta Row directly below Title */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {/* Availability Status Pill */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${
                candidate.discoveryStatus === "available"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                  : "bg-primary/10 text-primary border-primary/25"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  candidate.discoveryStatus === "available"
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-primary"
                }`}
              />
              <span>{availabilityLabels[candidate.availability] || "Open to Opps"}</span>
            </span>

            {/* Experience Pill */}
            <span className="inline-flex items-center gap-1 rounded-md bg-surface border border-border/80 px-2 py-0.5 text-xs font-semibold text-text">
              <Briefcase size={12} className="text-primary shrink-0" aria-hidden="true" />
              <span>{candidate.yearsOfExperience}+ Yrs Exp</span>
            </span>

            {/* Location */}
            <span className="inline-flex items-center gap-1 text-muted text-xs">
              <MapPin size={12} className="text-primary/70 shrink-0" aria-hidden="true" />
              <span>{candidate.location}</span>
            </span>

            {/* Work Modes */}
            <span className="inline-flex items-center gap-1 text-muted text-xs">
              <Clock size={12} className="text-primary/70 shrink-0" aria-hidden="true" />
              <span>{candidate.workModes.map((w) => workModeLabels[w] || w).join(" · ")}</span>
            </span>
          </div>
        </div>

        {/* Primary SAP Modules */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted/80">
            SAP Modules
          </p>
          <div className="flex flex-wrap gap-1.5">
            {candidate.sapModules.map((mod) => (
              <span
                key={mod}
                className="rounded-md border border-primary/25 bg-primary/5 px-2 py-0.5 text-xs font-semibold text-primary"
              >
                {mod}
              </span>
            ))}
          </div>
        </div>

        {/* Core Skills & Methodologies */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted/80">
            Specialized Skills
          </p>
          <div className="flex flex-wrap gap-1">
            {candidate.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] text-text shadow-2xs"
              >
                {skill}
              </span>
            ))}
            {candidate.skills.length > 3 ? (
              <span className="rounded-md border border-border/70 bg-surface/50 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                +{candidate.skills.length - 3} more
              </span>
            ) : null}
          </div>
        </div>

        {/* Summary Snippet */}
        <p className="line-clamp-2 text-xs leading-relaxed text-muted pt-0.5">
          {candidate.summary}
        </p>

        {/* Certification Snippet */}
        {candidate.certifications.length > 0 ? (
          <div className="flex items-center gap-1.5 rounded-lg bg-surface/70 border border-border/70 px-2.5 py-1.5 text-[11px] text-text">
            <GraduationCap size={14} className="text-primary shrink-0" aria-hidden="true" />
            <span className="truncate font-medium">{candidate.certifications[0]}</span>
          </div>
        ) : null}
      </div>

      {/* Card Footer: Full-Width 1-Line Action Button */}
      <div className="mt-5 border-t border-border/60 pt-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPreview(candidate);
          }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 py-2.5 px-4 text-xs font-bold text-primary transition duration-150 hover:bg-primary hover:text-white border border-primary/20 hover:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 whitespace-nowrap shadow-2xs"
        >
          <Eye size={14} aria-hidden="true" />
          <span>View Profile</span>
        </button>
      </div>
    </article>
  );
}
