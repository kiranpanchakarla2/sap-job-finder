"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Bookmark, Heart, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ApplicantAvatar } from "@/features/employer-applicants/components/ApplicantAvatar";
import {
  availabilityLabel,
  candidateStatusLabel,
  employmentTypeLabel,
  workModeLabel,
} from "../config/talentSearchFilters";
import { EMPLOYER_TALENT_SEARCH_ROUTES } from "../constants";
import { useTalentCollections } from "../hooks/useTalentCollections";
import type { TalentCandidate } from "../types/talentSearch.types";

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function CandidateProfileView({
  candidate,
}: {
  candidate: TalentCandidate;
}) {
  const { isSaved, isShortlisted, toggleSave, toggleShortlist } =
    useTalentCollections();
  const saved = isSaved(candidate.id);
  const shortlisted = isShortlisted(candidate.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <nav className="text-sm text-muted" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link
              href={EMPLOYER_TALENT_SEARCH_ROUTES.root}
              className="font-medium text-primary hover:underline"
            >
              Talent Search
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li className="text-text">Candidate Profile</li>
        </ol>
      </nav>

      <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <ApplicantAvatar
              name={candidate.name}
              avatarUrl={candidate.avatarUrl}
              size="lg"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-text">
                  {candidate.name}
                </h1>
                <StatusBadge
                  tone={
                    candidate.candidateStatus === "not_available"
                      ? "muted"
                      : "success"
                  }
                >
                  {candidateStatusLabel(candidate.candidateStatus)}
                </StatusBadge>
              </div>
              <p className="mt-1 text-sm font-medium text-primary">
                {candidate.title}
              </p>
              <p className="mt-2 text-sm text-muted">
                {candidate.yearsOfExperience} years experience · {candidate.location}
              </p>
              <p className="mt-1 text-sm text-muted">
                {candidate.workModes.map(workModeLabel).join(" · ")} · Available{" "}
                {availabilityLabel(candidate.availability)}
              </p>
              <p className="mt-1 text-sm text-muted">
                {candidate.employmentTypes.map(employmentTypeLabel).join(" · ")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              aria-pressed={saved}
              aria-label={saved ? "Remove from saved" : "Save candidate"}
              onClick={() => {
                void (async () => {
                  const result = await toggleSave(candidate.id);
                  if (result === "error") {
                    toast.error("Unable to update saved candidates.");
                    return;
                  }
                  toast.success(
                    result === "saved"
                      ? "Candidate saved."
                      : "Candidate removed from saved candidates.",
                  );
                })();
              }}
            >
              <Bookmark
                size={16}
                aria-hidden="true"
                className={saved ? "fill-current" : undefined}
              />
              {saved ? "Saved" : "Save Candidate"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              aria-pressed={shortlisted}
              aria-label={
                shortlisted ? "Remove from shortlist" : "Add to shortlist"
              }
              title={shortlisted ? "Remove from shortlist" : "Add to shortlist"}
              onClick={() => {
                void (async () => {
                  const result = await toggleShortlist(candidate.id);
                  if (result === "error") {
                    toast.error("Unable to update shortlist.");
                    return;
                  }
                  toast.success(
                    result === "shortlisted"
                      ? "Candidate added to shortlist."
                      : "Candidate removed from shortlist.",
                  );
                })();
              }}
            >
              <Heart
                size={16}
                aria-hidden="true"
                className={shortlisted ? "fill-current" : undefined}
              />
              {shortlisted ? "Shortlisted" : "Shortlist"}
            </Button>
            <Button
              type="button"
              onClick={() =>
                toast.message(
                  "Messaging integration will be connected in Talent Search integration sprint.",
                )
              }
            >
              <MessageSquare size={16} aria-hidden="true" />
              Contact Candidate
            </Button>
          </div>
        </div>
      </div>

      <Section title="Professional Summary">
        <p className="text-sm leading-relaxed text-muted">{candidate.summary}</p>
      </Section>

      <Section title="SAP Expertise">
        <ul className="flex flex-wrap gap-2">
          {candidate.sapModules.map((module) => (
            <li key={module}>
              <StatusBadge tone="default">{module}</StatusBadge>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Skills">
        <ul className="flex flex-wrap gap-2">
          {candidate.skills.map((skill) => (
            <li key={skill}>
              <span className="inline-flex rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text">
                {skill}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Professional Experience">
        <ol className="space-y-4">
          {candidate.experience.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-border bg-surface/40 px-4 py-3"
            >
              <p className="text-sm font-semibold text-text">{entry.role}</p>
              <p className="mt-0.5 text-sm text-muted">{entry.company}</p>
              <p className="mt-1 text-xs text-muted">
                {entry.startDate} – {entry.endDate ?? "Present"}
              </p>
              <p className="mt-2 text-sm text-muted">{entry.description}</p>
              {entry.skills.length ? (
                <p className="mt-2 text-xs text-muted">
                  {entry.skills.join(" · ")}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Certifications">
        {candidate.certifications.length ? (
          <ul className="space-y-3">
            {candidate.certifications.map((cert) => (
              <li
                key={cert.id}
                className="rounded-xl border border-border bg-surface/40 px-4 py-3"
              >
                <p className="text-sm font-semibold text-text">{cert.name}</p>
                <p className="mt-1 text-xs text-muted">
                  {cert.type} · {cert.year} · Certification listed
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No certifications listed.</p>
        )}
      </Section>

      <Section title="Education">
        {candidate.education.length ? (
          <ul className="space-y-3">
            {candidate.education.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-border bg-surface/40 px-4 py-3"
              >
                <p className="text-sm font-semibold text-text">
                  {item.degree} in {item.field}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {item.school} · {item.year}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No education listed.</p>
        )}
      </Section>

      <Section title="Languages">
        <ul className="flex flex-wrap gap-2">
          {candidate.languages.map((language) => (
            <li key={language}>
              <span className="inline-flex rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text">
                {language}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <div>
        <Button href={EMPLOYER_TALENT_SEARCH_ROUTES.root} variant="secondary">
          Back to Talent Search
        </Button>
      </div>
    </div>
  );
}
