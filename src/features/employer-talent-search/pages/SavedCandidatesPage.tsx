"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import {
  FeatureLockCard,
  useEmployerPlan,
} from "@/features/employer-subscription";
import { CandidateResults } from "../components/CandidateCard";
import { SavedCandidatesEmptyState } from "../components/TalentSearchEmptyState";
import { TalentSearchSkeleton } from "../components/TalentSearchSkeleton";
import { TalentSearchTabs } from "../components/TalentSearchTabs";
import { EMPLOYER_TALENT_SEARCH_ROUTES } from "../constants";
import { useTalentCollections } from "../hooks/useTalentCollections";
import { talentSearchService } from "../services/talentSearchService";
import type { TalentCandidate } from "../types/talentSearch.types";

function SavedCandidatesLocked() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <nav className="mb-2 text-sm text-muted" aria-label="Breadcrumb">
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
            <li className="text-text">Saved Candidates</li>
          </ol>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Saved Candidates
        </h1>
        <p className="mt-1 text-sm text-muted">
          Candidates you saved to revisit later.
        </p>
      </div>
      <FeatureLockCard
        title="Talent Search"
        description="Talent Search is available with Pro and Business plans."
      />
    </div>
  );
}

function SavedCandidatesContent() {
  const { isReady, reloadCollections } = useTalentCollections();
  const [candidates, setCandidates] = useState<TalentCandidate[]>([]);
  const [unavailableCount, setUnavailableCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    const result = await talentSearchService.getSavedCandidates();
    if (!result.success) {
      setIsError(true);
      setError(result.error);
      setCandidates([]);
      setUnavailableCount(0);
      setIsLoading(false);
      return;
    }
    setCandidates(result.data.items);
    setUnavailableCount(
      Math.max(0, result.data.ids.length - result.data.items.length),
    );
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    void load();
  }, [isReady, load]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <nav className="mb-2 text-sm text-muted" aria-label="Breadcrumb">
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
              <li className="text-text">Saved Candidates</li>
            </ol>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Saved Candidates
          </h1>
          <p className="mt-1 text-sm text-muted">
            Candidates you saved to revisit later.
          </p>
        </div>
        <TalentSearchTabs active="saved" />
      </div>

      {isError ? (
        <ErrorState
          title="Unable to load candidates."
          description={error ?? undefined}
          onRetry={() => {
            void reloadCollections();
            void load();
          }}
        />
      ) : isLoading || !isReady ? (
        <TalentSearchSkeleton />
      ) : candidates.length === 0 ? (
        <SavedCandidatesEmptyState />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted" aria-live="polite">
            {candidates.length} saved candidate
            {candidates.length === 1 ? "" : "s"}
            {unavailableCount > 0
              ? ` · ${unavailableCount} no longer available`
              : null}
          </p>
          <CandidateResults candidates={candidates} viewMode="list" />
        </div>
      )}
    </div>
  );
}

export function SavedCandidatesPage() {
  const { hasFeature, isLoading } = useEmployerPlan();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <TalentSearchSkeleton />
      </div>
    );
  }

  if (!hasFeature("talentSearch")) {
    return <SavedCandidatesLocked />;
  }

  return <SavedCandidatesContent />;
}
