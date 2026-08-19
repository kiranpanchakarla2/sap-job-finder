"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  GraduationCap,
  Layers,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";
import type { PublicTalentCandidate } from "../types/publicTalent.types";

type PublicTalentPreviewModalProps = {
  candidate: PublicTalentCandidate | null;
  onClose: () => void;
};

export function PublicTalentPreviewModal({
  candidate,
  onClose,
}: PublicTalentPreviewModalProps) {
  useEffect(() => {
    if (!candidate) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [candidate, onClose]);

  if (!candidate) return null;

  const availabilityLabels: Record<string, string> = {
    available_now: "Available Immediately",
    within_2_weeks: "Available within 2 weeks",
    within_1_month: "Available within 1 month",
    exploring: "Open to Opportunities",
  };

  const workModeLabels: Record<string, string> = {
    remote: "Remote",
    hybrid: "Hybrid",
    onsite: "On-site",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-card shadow-lift">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-4 bg-surface/40">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Eye size={15} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Controlled Profile Preview
              </p>
              <p className="text-[11px] text-muted">Public anonymous view</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview modal"
            className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Headline & Meta Box */}
          <div className="rounded-xl border border-border bg-surface/50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                    <User size={20} aria-hidden="true" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-muted">Anonymous SAP Talent</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 shadow-2xs">
                        <ShieldCheck size={12} className="text-emerald-600 dark:text-emerald-400 stroke-[2.2]" aria-hidden="true" />
                        <span>Verified Profile</span>
                      </span>
                    </div>
                    <h2
                      id="preview-modal-title"
                      className="text-lg sm:text-xl font-bold text-text"
                    >
                      {candidate.title}
                    </h2>
                  </div>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                  candidate.discoveryStatus === "available"
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : "bg-primary/10 text-primary border-primary/20"
                }`}
              >
                <Sparkles size={12} aria-hidden="true" />
                <span>{availabilityLabels[candidate.availability] || "Open to Opportunities"}</span>
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 pt-3 text-xs sm:text-sm text-muted">
              <div className="flex items-center gap-1.5 font-medium text-text">
                <Briefcase size={15} className="text-primary" aria-hidden="true" />
                <span>{candidate.yearsOfExperience}+ Years Experience</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={15} className="text-primary" aria-hidden="true" />
                <span>{candidate.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={15} className="text-primary" aria-hidden="true" />
                <span>{candidate.workModes.map((w) => workModeLabels[w] || w).join(" · ")}</span>
              </div>
            </div>
          </div>

          {/* SAP Expertise & Modules */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Primary SAP Modules
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {candidate.sapModules.map((mod) => (
                <span
                  key={mod}
                  className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary"
                >
                  {mod}
                </span>
              ))}
            </div>
          </div>

          {/* Technical / Functional Skills */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Specialized Skills
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {candidate.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-text shadow-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Domain Summary */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Domain Competency Summary
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted bg-surface/40 p-4 rounded-xl border border-border/70">
              {candidate.summary}
            </p>
          </div>

          {/* Certifications (Publicly visible verified credentials) */}
          {candidate.certifications.length > 0 ? (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                Verified SAP Certifications
              </h3>
              <ul className="mt-2 space-y-2">
                {candidate.certifications.map((cert) => (
                  <li
                    key={cert}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-text shadow-xs"
                  >
                    <GraduationCap size={15} className="text-primary shrink-0" aria-hidden="true" />
                    <span>{cert}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* ========================================================================= */}
          {/* LOCKED / PROTECTED EMPLOYER SECTIONS */}
          {/* ========================================================================= */}
          <div className="relative rounded-xl border border-dashed border-border/90 bg-surface/30 p-5">
            <div className="space-y-4 filter blur-[3px] select-none opacity-40 pointer-events-none" aria-hidden="true">
              <div>
                <p className="text-xs font-bold uppercase text-muted">Detailed Work History</p>
                <div className="mt-2 h-4 w-3/4 rounded bg-muted/30" />
                <div className="mt-1 h-3 w-1/2 rounded bg-muted/20" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-muted">Direct Contact Details</p>
                <div className="mt-2 flex gap-4">
                  <div className="h-4 w-28 rounded bg-muted/30" />
                  <div className="h-4 w-28 rounded bg-muted/30" />
                </div>
              </div>
            </div>

            {/* Lock Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-card/85 rounded-xl backdrop-blur-xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                <Lock size={18} aria-hidden="true" />
              </div>
              <p className="mt-2 text-sm font-bold text-text">
                Full Profile, Work History & Contact Details Protected
              </p>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-muted">
                Candidate identity, detailed client histories, and direct contact options are reserved
                exclusively for verified employers.
              </p>
              <Link
                href="/employer/login"
                className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-primary px-5 py-2.5 text-xs font-semibold text-white shadow-[var(--shadow-button)] transition hover:bg-primary/90"
              >
                <span>Sign in as an Employer to View Full Profile</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/80 bg-surface/50 px-6 py-4">
          <p className="text-xs text-muted text-center sm:text-left">
            Need specialized SAP consultants for an upcoming project?
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-[var(--radius-control)] border border-border bg-card px-4 py-2 text-xs font-semibold text-text hover:bg-surface transition"
            >
              Close
            </button>
            <Link
              href="/employer/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-control)] bg-primary px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-primary/90"
            >
              <span>Employer Sign In</span>
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
