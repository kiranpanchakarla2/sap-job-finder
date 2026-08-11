"use client";

import { Bookmark, Heart } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ApplicantAvatar } from "@/features/employer-applicants/components/ApplicantAvatar";
import {
  availabilityLabel,
  candidateStatusLabel,
  workModeLabel,
} from "../config/talentSearchFilters";
import { EMPLOYER_TALENT_SEARCH_ROUTES } from "../constants";
import { useTalentCollections } from "../hooks/useTalentCollections";
import type { TalentCandidate, TalentViewMode } from "../types/talentSearch.types";

export function CandidateCard({
  candidate,
  viewMode = "list",
}: {
  candidate: TalentCandidate;
  viewMode?: TalentViewMode;
}) {
  const { isSaved, isShortlisted, toggleSave, toggleShortlist } =
    useTalentCollections();
  const saved = isSaved(candidate.id);
  const shortlisted = isShortlisted(candidate.id);

  const onSave = () => {
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
  };

  const onShortlist = () => {
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
  };

  const modules = candidate.sapModules.slice(0, 4).join(" · ");
  const workModes = candidate.workModes.map(workModeLabel).join(" · ");

  return (
    <article
      className={`flex h-full flex-col rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-soft ${
        viewMode === "list" ? "sm:flex-row sm:items-start sm:gap-4" : ""
      }`}
    >
      <div className="flex min-w-0 flex-1 gap-3">
        <ApplicantAvatar
          name={candidate.name}
          avatarUrl={candidate.avatarUrl}
          size={viewMode === "grid" ? "md" : "lg"}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-text">
                {candidate.name}
              </h3>
              <p className="mt-0.5 text-sm font-medium text-primary">
                {candidate.title}
              </p>
            </div>
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

          <p className="mt-2 text-sm text-muted">
            {candidate.yearsOfExperience} years experience
          </p>
          <p className="mt-1 text-sm text-text">{modules}</p>
          <p className="mt-2 text-xs text-muted">
            {candidate.location}
            {workModes ? ` · ${workModes}` : ""}
          </p>
          <p className="mt-1 text-xs text-muted">
            Available: {availabilityLabel(candidate.availability)}
          </p>
          {candidate.certifications.length > 0 ? (
            <p className="mt-1 text-xs font-medium text-text">
              Certification listed
            </p>
          ) : null}
          <p className="mt-2 line-clamp-2 text-sm text-muted">
            {candidate.summary}
          </p>
        </div>
      </div>

      <div
        className={`mt-4 flex flex-wrap gap-2 ${
          viewMode === "list" ? "sm:mt-0 sm:flex-col sm:items-stretch" : ""
        }`}
      >
        <Button
          type="button"
          variant="secondary"
          className="!px-3 !py-2 text-xs"
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save candidate"}
          onClick={onSave}
        >
          <Bookmark
            size={14}
            aria-hidden="true"
            className={saved ? "fill-current" : undefined}
          />
          {saved ? "Saved" : "Save"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="!px-3 !py-2 text-xs"
          aria-pressed={shortlisted}
          aria-label={
            shortlisted ? "Remove from shortlist" : "Add to shortlist"
          }
          title={shortlisted ? "Remove from shortlist" : "Add to shortlist"}
          onClick={onShortlist}
        >
          <Heart
            size={14}
            aria-hidden="true"
            className={shortlisted ? "fill-current" : undefined}
          />
          {shortlisted ? "Shortlisted" : "Shortlist"}
        </Button>
        <Button
          href={EMPLOYER_TALENT_SEARCH_ROUTES.candidate(candidate.id)}
          className="!px-3 !py-2 text-xs"
        >
          View Profile
        </Button>
      </div>
    </article>
  );
}

export function CandidateResults({
  candidates,
  viewMode,
}: {
  candidates: TalentCandidate[];
  viewMode: TalentViewMode;
}) {
  if (viewMode === "grid") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {candidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            viewMode="grid"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {candidates.map((candidate) => (
        <CandidateCard
          key={candidate.id}
          candidate={candidate}
          viewMode="list"
        />
      ))}
    </div>
  );
}

