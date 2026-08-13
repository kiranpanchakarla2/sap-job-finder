"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import {
  FeatureLockCard,
  useEmployerPlan,
} from "@/features/employer-subscription";
import { DEFAULT_PAGE_SIZE } from "../config/talentSearchFilters";
import { ActiveFilterChips } from "../components/ActiveFilterChips";
import { CandidateResults } from "../components/CandidateCard";
import { TalentSearchBar } from "../components/TalentSearchBar";
import { TalentSearchEmptyState } from "../components/TalentSearchEmptyState";
import {
  TalentSearchDesktopFilters,
  TalentSearchMobileFilters,
} from "../components/TalentSearchFiltersShell";
import { TalentSearchPagination } from "../components/TalentSearchPagination";
import { TalentSearchSkeleton } from "../components/TalentSearchSkeleton";
import { TalentSearchTabs } from "../components/TalentSearchTabs";
import { TalentSearchToolbar } from "../components/TalentSearchToolbar";
import { useTalentSearch } from "../hooks/useTalentSearch";
import { talentSearchService } from "../services/talentSearchService";
import type { TalentUsage } from "../services/talentSearchService";

function TalentSearchLocked() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Talent Search
        </h1>
        <p className="mt-1 text-sm text-muted">
          Find qualified SAP professionals faster.
        </p>
      </div>
      <FeatureLockCard
        title="Talent Search"
        description="Talent Search is available with Pro and Business plans."
      />
    </div>
  );
}

function TalentUsageBanner({ usage }: { usage: TalentUsage }) {
  if (usage.limit === null) {
    return (
      <p className="text-sm text-muted">
        Talent Search profile views this period: {usage.used} (unlimited)
      </p>
    );
  }

  const atLimit = usage.used >= usage.limit;

  return (
    <div
      role="status"
      className={`rounded-xl border px-4 py-3 text-sm ${
        atLimit
          ? "border-error/30 bg-error/10 text-text"
          : "border-border bg-surface text-muted"
      }`}
    >
      <p>
        Talent Search profile views: {usage.used} / {usage.limit} this period
        {atLimit ? " — limit reached." : "."}
      </p>
      {atLimit ? (
        <p className="mt-2">
          <Link
            href="/employer/subscription"
            className="font-medium text-primary hover:underline"
          >
            View Plans
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function TalentSearchContent() {
  const {
    filters,
    keywordDraft,
    setKeywordDraft,
    applyKeywordSearch,
    updateFilters,
    replaceFilters,
    clearFilters,
    removeChip,
    chips,
    sort,
    setSort,
    page,
    setPage,
    viewMode,
    setViewMode,
    result,
    isLoading,
    isError,
    error,
    reload,
  } = useTalentSearch();

  const [usage, setUsage] = useState<TalentUsage | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await talentSearchService.getUsage();
      if (response.success) {
        setUsage(response.data);
      }
    })();
  }, [result]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Talent Search
          </h1>
          <p className="mt-1 text-sm text-muted">
            Find qualified SAP professionals for your open positions.
          </p>
        </div>
        <TalentSearchTabs active="search" />
      </div>

      {usage ? <TalentUsageBanner usage={usage} /> : null}

      <TalentSearchBar
        value={keywordDraft}
        onChange={setKeywordDraft}
        onSearch={applyKeywordSearch}
      />

      {isError ? (
        <ErrorState
          title="Unable to load candidates."
          description={error ?? undefined}
          onRetry={reload}
          action={
            error?.includes("Talent Search limit") ? (
              <Link
                href="/employer/subscription"
                className="font-medium text-primary hover:underline"
              >
                View Plans
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <TalentSearchDesktopFilters
            filters={filters}
            onChange={updateFilters}
            onClear={clearFilters}
          />

          <div className="min-w-0 flex-1 space-y-4">
            <ActiveFilterChips
              chips={chips}
              onRemove={removeChip}
              onClearAll={clearFilters}
            />

            <TalentSearchToolbar
              total={result?.total ?? 0}
              page={result?.page ?? page}
              pageSize={result?.pageSize ?? DEFAULT_PAGE_SIZE}
              sort={sort}
              viewMode={viewMode}
              onSortChange={setSort}
              onViewModeChange={setViewMode}
              filterButton={
                <TalentSearchMobileFilters
                  filters={filters}
                  onApply={replaceFilters}
                  onClear={clearFilters}
                />
              }
            />

            {isLoading || !result ? (
              <TalentSearchSkeleton />
            ) : result.total === 0 ? (
              <TalentSearchEmptyState onClearFilters={clearFilters} />
            ) : (
              <>
                <CandidateResults
                  candidates={result.items}
                  viewMode={viewMode}
                />
                <TalentSearchPagination
                  page={result.page}
                  totalPages={result.totalPages}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function TalentSearchPage() {
  const { hasFeature, isLoading } = useEmployerPlan();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <TalentSearchSkeleton />
      </div>
    );
  }

  if (!hasFeature("talentSearch")) {
    return <TalentSearchLocked />;
  }

  return <TalentSearchContent />;
}
