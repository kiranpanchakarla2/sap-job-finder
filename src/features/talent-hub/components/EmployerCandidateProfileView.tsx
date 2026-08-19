"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Heart,
  Layers,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { ContactCandidateModal } from "./ContactCandidateModal";
import type { EmployerCandidateProfile } from "../types/employerCandidate.types";

type EmployerCandidateProfileViewProps = {
  candidate: EmployerCandidateProfile;
};

export function EmployerCandidateProfileView({
  candidate,
}: EmployerCandidateProfileViewProps) {
  const [saved, setSaved] = useState(false);
  const [shortlisted, setShortlisted] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const availabilityLabels: Record<string, string> = {
    available_now: "Available Immediately",
    within_2_weeks: "Within 2 Weeks",
    within_1_month: "Within 1 Month",
    exploring: "Open to Opportunities",
  };

  const workModeLabels: Record<string, string> = {
    remote: "Remote",
    hybrid: "Hybrid",
    onsite: "On-site",
  };

  const handleToggleSave = () => {
    setSaved((prev) => {
      const next = !prev;
      toast.success(next ? "Candidate added to saved candidates." : "Candidate removed from saved.");
      return next;
    });
  };

  const handleToggleShortlist = () => {
    setShortlisted((prev) => {
      const next = !prev;
      toast.success(next ? "Candidate added to shortlist." : "Candidate removed from shortlist.");
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Breadcrumb Nav */}
      <nav className="flex items-center justify-between text-xs text-muted" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/talent-hub" className="hover:text-primary transition">
              Talent Hub
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <Link href="/talent-hub/search" className="hover:text-primary transition">
              Talent Search
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li className="font-semibold text-text truncate max-w-[200px]">{candidate.name}</li>
        </ol>

        {/* Employer Access Subtle Indicator */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold text-primary">
          <ShieldCheck size={13} aria-hidden="true" />
          <span>Employer Access</span>
        </div>
      </nav>

      {/* Main Candidate Header Card */}
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 text-xl font-bold">
              {candidate.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text">
                  {candidate.name}
                </h1>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                    candidate.discoveryStatus === "available"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-primary/10 text-primary border-primary/20"
                  }`}
                >
                  {availabilityLabels[candidate.availability] || "Open to Opportunities"}
                </span>
              </div>

              <p className="mt-1 text-base font-semibold text-primary">{candidate.headline}</p>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-muted">
                <div className="flex items-center gap-1.5 font-medium text-text">
                  <Briefcase size={15} className="text-primary shrink-0" aria-hidden="true" />
                  <span>{candidate.yearsOfExperience}+ Years SAP Experience</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={15} className="text-primary shrink-0" aria-hidden="true" />
                  <span>{candidate.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={15} className="text-primary shrink-0" aria-hidden="true" />
                  <span>{candidate.workModes.map((w) => workModeLabels[w] || w).join(" · ")}</span>
                </div>
                {candidate.noticePeriod ? (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-text">Notice:</span>
                    <span>{candidate.noticePeriod}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
            <button
              type="button"
              onClick={handleToggleSave}
              aria-label={saved ? "Remove from saved" : "Save candidate"}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold shadow-xs transition ${
                saved
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-text hover:bg-card hover:border-primary/40"
              }`}
            >
              <Bookmark size={14} className={saved ? "fill-current" : undefined} />
              <span>{saved ? "Saved" : "Save"}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleShortlist}
              aria-label={shortlisted ? "Remove from shortlist" : "Add to shortlist"}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold shadow-xs transition ${
                shortlisted
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-600"
                  : "border-border bg-surface text-text hover:bg-card hover:border-rose-500/40"
              }`}
            >
              <Heart size={14} className={shortlisted ? "fill-current" : undefined} />
              <span>{shortlisted ? "Shortlisted" : "Shortlist"}</span>
            </button>

            <button
              type="button"
              onClick={() => setContactModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-primary/90"
            >
              <MessageSquare size={14} aria-hidden="true" />
              <span>Contact Candidate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Main Column (Summary, Experience, Certifications) + Sidebar Column (Skills, Preferences, Documents) */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Professional Summary */}
          <section className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text flex items-center gap-2">
              <User size={16} className="text-primary" />
              <span>Professional Summary</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {candidate.professionalSummary}
            </p>
          </section>

          {/* SAP Project & Work Experience */}
          <section className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text flex items-center gap-2">
              <Briefcase size={16} className="text-primary" />
              <span>SAP Experience & Implementation History</span>
            </h2>

            <div className="mt-5 space-y-6">
              {candidate.experience.map((exp, index) => (
                <div
                  key={exp.id || index}
                  className="relative pl-6 border-l-2 border-primary/30 last:border-transparent space-y-2"
                >
                  <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-primary bg-card" />
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-text">{exp.role}</h3>
                      <p className="text-xs font-semibold text-primary">{exp.company}</p>
                    </div>
                    <span className="rounded-md bg-surface px-2.5 py-1 text-xs font-medium text-muted border border-border/60">
                      {exp.startDate} – {exp.endDate || "Present"}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm leading-relaxed text-muted pt-1">
                    {exp.description}
                  </p>

                  {exp.skills && exp.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {exp.skills.map((s) => (
                        <span
                          key={s}
                          className="rounded-md border border-border/80 bg-surface/70 px-2 py-0.5 text-[11px] text-muted"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          {/* SAP Certifications */}
          <section className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text flex items-center gap-2">
              <GraduationCap size={16} className="text-primary" />
              <span>SAP Certifications & Credentials</span>
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {candidate.certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="rounded-xl border border-border bg-surface/40 p-4 shadow-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <GraduationCap size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-text">{cert.name}</h3>
                      <p className="mt-1 text-[11px] text-muted">
                        Issued by {cert.issuingOrg} · {cert.year}
                      </p>
                      {cert.credentialId ? (
                        <p className="mt-0.5 text-[10px] text-primary font-medium">
                          ID: {cert.credentialId}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Education */}
          {candidate.education.length > 0 ? (
            <section className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft">
              <h2 className="text-sm font-bold uppercase tracking-wider text-text flex items-center gap-2">
                <GraduationCap size={16} className="text-primary" />
                <span>Education</span>
              </h2>

              <div className="mt-4 space-y-3">
                {candidate.education.map((edu) => (
                  <div
                    key={edu.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/80 bg-surface/30 px-4 py-3"
                  >
                    <div>
                      <h3 className="text-xs font-bold text-text">
                        {edu.degree} in {edu.field}
                      </h3>
                      <p className="text-xs text-muted">{edu.school}</p>
                    </div>
                    <span className="text-xs text-muted font-medium">{edu.year}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* SAP Expertise & Modules */}
          <section className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
              Primary SAP Modules
            </h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {candidate.sapModules.map((mod) => (
                <span
                  key={mod}
                  className="rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-bold text-primary"
                >
                  {mod}
                </span>
              ))}
            </div>

            <h2 className="mt-5 text-xs font-bold uppercase tracking-wider text-muted">
              Skills & Methodologies
            </h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {candidate.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text shadow-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>

          {/* Preferences & Availability */}
          <section className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
              Engagement Preferences
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted">Work Arrangement</span>
                <span className="font-semibold text-text">
                  {candidate.workModes.map((w) => workModeLabels[w] || w).join(" / ")}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted">Availability</span>
                <span className="font-semibold text-primary">
                  {availabilityLabels[candidate.availability] || "Open"}
                </span>
              </div>

              {candidate.noticePeriod ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted">Notice Period</span>
                  <span className="font-semibold text-text">{candidate.noticePeriod}</span>
                </div>
              ) : null}

              <div className="flex items-center justify-between">
                <span className="text-muted">Preferred Locations</span>
                <span className="font-semibold text-text">
                  {candidate.preferredLocations.join(", ")}
                </span>
              </div>
            </div>
          </section>

          {/* Languages */}
          {candidate.languages.length > 0 ? (
            <section className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
                Languages
              </h2>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {candidate.languages.map((lang) => (
                  <span
                    key={lang}
                    className="rounded-md border border-border/80 bg-surface/60 px-2.5 py-1 text-xs text-text"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {/* Documents / Resume (Permitted access only) */}
          {candidate.hasResumeAccess ? (
            <section className="rounded-[var(--radius-card)] border border-primary/20 bg-primary/5 p-5 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-text">Candidate Resume</h3>
                  <p className="text-[11px] text-muted truncate">
                    {candidate.resumeFileName || "Verified SAP Resume"}
                  </p>
                  <a
                    href={candidate.resumeUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!candidate.resumeUrl?.startsWith("http")) {
                        e.preventDefault();
                        toast.info("Downloading candidate resume preview.");
                      }
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary/90"
                  >
                    <Download size={13} />
                    <span>Download Resume</span>
                  </a>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {/* Bottom Back Button */}
      <div className="pt-4 border-t border-border/60">
        <Link
          href="/talent-hub/search"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-text shadow-soft hover:bg-surface transition"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <span>Back to Talent Search</span>
        </Link>
      </div>

      {/* Contact Candidate Modal */}
      <ContactCandidateModal
        candidate={candidate}
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />
    </div>
  );
}
