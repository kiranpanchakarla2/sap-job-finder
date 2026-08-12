"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { PAGE_SIZE } from "../constants";
import { buildResultsSummary, countActiveFilters } from "../lib/filterJobs";
import { jobsListHref, useJobsBasePath } from "../lib/jobsBasePath";
import { loadCandidateMatchProfile } from "../lib/loadCandidateMatchProfile";
import { scoreJobMatch } from "../lib/matchJobs";
import { candidateJobService } from "../services/candidateJobService";
import {
  DEFAULT_JOB_SEARCH_STATE,
  type DiscoveryJob,
  type JobSearchState,
  type JobSortOption,
  type MatchTier,
} from "../types/job.types";
import { DiscoveryJobCard } from "../components/DiscoveryJobCard";
import { JobFilterDrawer, JobFilterSidebar } from "../components/JobFilterSidebar";
import { JobSearchBar } from "../components/JobSearchBar";
import { JobEmptyState, JobErrorState, JobListSkeleton } from "../components/JobStates";

function stateFromParams(params: URLSearchParams): JobSearchState {
  const workMode = params.get("workMode");
  const type = params.get("type");
  return {
    ...DEFAULT_JOB_SEARCH_STATE,
    keyword: params.get("q") ?? "",
    location: params.get("location") ?? "",
    workModes:
      workMode === "remote"
        ? ["Remote"]
        : workMode === "hybrid"
          ? ["Hybrid"]
          : workMode === "onsite" || workMode === "on-site"
            ? ["On-site"]
            : [],
    jobTypes:
      type === "contract"
        ? ["Contract"]
        : type === "internship"
          ? ["Internship"]
          : type === "part-time"
            ? ["Part-time"]
            : [],
    sort: (params.get("sort") as JobSortOption) || "relevance",
  };
}

function writeParams(state: JobSearchState): string {
  const params = new URLSearchParams();
  if (state.keyword.trim()) params.set("q", state.keyword.trim());
  if (state.location.trim()) params.set("location", state.location.trim());
  if (state.workModes.length === 1) {
    params.set("workMode", state.workModes[0].toLowerCase().replace("on-site", "onsite"));
  }
  if (state.jobTypes.length === 1) {
    params.set("type", state.jobTypes[0].toLowerCase());
  }
  if (state.sort !== "relevance") params.set("sort", state.sort);
  return params.toString();
}

type RecommendedItem = DiscoveryJob & { matchTier: MatchTier | null };

export function JobSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobsBasePath = useJobsBasePath();
  const [state, setState] = useState<JobSearchState>(() =>
    stateFromParams(new URLSearchParams(searchParams.toString())),
  );
  const [draftKeyword, setDraftKeyword] = useState(state.keyword);
  const [draftLocation, setDraftLocation] = useState(state.location);
  const [jobs, setJobs] = useState<DiscoveryJob[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [matchTiers, setMatchTiers] = useState<Record<string, MatchTier | null>>({});
  const [recommended, setRecommended] = useState<RecommendedItem[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const next = stateFromParams(new URLSearchParams(searchParams.toString()));
    setState((prev) => ({
      ...prev,
      keyword: next.keyword,
      location: next.location,
      workModes: next.workModes.length ? next.workModes : prev.workModes,
      jobTypes: next.jobTypes.length ? next.jobTypes : prev.jobTypes,
      sort: next.sort,
    }));
    setDraftKeyword(next.keyword);
    setDraftLocation(next.location);
  }, [searchParams]);

  const loadJobs = useCallback(
    async (filters: JobSearchState, mode: "replace" | "append") => {
      if (mode === "replace") {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const offset = mode === "append" ? jobs.length : 0;
      const result = await candidateJobService.searchJobs(filters, {
        offset,
        limit: PAGE_SIZE,
      });

      if (!result.success) {
        setError(result.error);
        if (mode === "replace") setJobs([]);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      setJobs((prev) =>
        mode === "append" ? [...prev, ...result.data.jobs] : result.data.jobs,
      );
      setTotal(result.data.total);
      setHasMore(result.data.hasMore);

      const profile = await loadCandidateMatchProfile();
      const tiers: Record<string, MatchTier | null> = {};
      for (const job of result.data.jobs) {
        tiers[job.id] = scoreJobMatch(job, profile).tier;
      }
      setMatchTiers((prev) => (mode === "append" ? { ...prev, ...tiers } : tiers));

      setLoading(false);
      setLoadingMore(false);
    },
    [jobs.length],
  );

  useEffect(() => {
    void loadJobs(state, "replace");
    // Intentionally re-run when filter state changes (not loadJobs identity).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const profile = await loadCandidateMatchProfile();
      const result = await candidateJobService.getRecommendedJobs(profile, 4);
      if (cancelled || !result.success) return;
      setRecommended(
        result.data.map((job) => ({
          ...job,
          matchTier: scoreJobMatch(job, profile).tier,
        })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applySearch = () => {
    const next = {
      ...state,
      keyword: draftKeyword,
      location: draftLocation,
    };
    setState(next);
    const qs = writeParams(next);
    startTransition(() => {
      router.replace(jobsListHref(jobsBasePath, qs));
    });
  };

  const updateFilters = (next: JobSearchState) => {
    setState(next);
  };

  const clearFilters = () => {
    setState(DEFAULT_JOB_SEARCH_STATE);
    setDraftKeyword("");
    setDraftLocation("");
    toast.success("Filters cleared.");
    startTransition(() => router.replace(jobsBasePath));
  };

  const summary = buildResultsSummary(state, total);
  const activeFilterCount = countActiveFilters(state);
  const showRecommended =
    !activeFilterCount && !state.keyword && recommended.length > 0 && !error;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-text">
          Find Your Next SAP Opportunity
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Discover SAP jobs that match your skills, experience, and career goals.
        </p>
      </header>

      <JobSearchBar
        keyword={draftKeyword}
        location={draftLocation}
        onKeywordChange={setDraftKeyword}
        onLocationChange={setDraftLocation}
        onSearch={applySearch}
      />

      {showRecommended ? (
        <section aria-labelledby="recommended-heading">
          <div className="mb-3">
            <h2 id="recommended-heading" className="text-lg font-semibold text-text">
              Recommended for You
            </h2>
            <p className="text-xs text-muted">
              Based on your skills, experience, and preferences — not AI-powered.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {recommended.map((job) => (
              <DiscoveryJobCard key={job.id} job={job} matchTier={job.matchTier} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="hidden lg:block">
          <JobFilterSidebar
            state={state}
            onChange={updateFilters}
            onClear={clearFilters}
            className="sticky top-24"
          />
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-text">{summary.countLabel}</p>
              <p className="text-xs text-muted">{summary.contextLabel}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-button)] border border-border bg-card px-3 text-sm font-semibold text-text lg:hidden"
                onClick={() => setFiltersOpen(true)}
              >
                <SlidersHorizontal size={16} aria-hidden="true" />
                Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
              </button>
              <label className="flex items-center gap-2 text-sm text-muted">
                <span className="whitespace-nowrap">Sort by</span>
                <NativeSelect
                  value={state.sort}
                  onChange={(e) =>
                    updateFilters({
                      ...state,
                      sort: e.target.value as JobSortOption,
                    })
                  }
                  className="rounded-[var(--radius-control)] border border-border bg-card px-3 py-2 text-sm text-text"
                  aria-label="Sort by"
                >
                  <option value="relevance">Relevance</option>
                  <option value="recent">Most Recent</option>
                  <option value="salary_high">Salary: High to Low</option>
                  <option value="salary_low">Salary: Low to High</option>
                </NativeSelect>
              </label>
            </div>
          </div>

          {error ? (
            <JobErrorState onRetry={() => void loadJobs(state, "replace")} />
          ) : loading ? (
            <JobListSkeleton />
          ) : jobs.length ? (
            <>
              <div className="grid gap-4">
                {jobs.map((job) => (
                  <DiscoveryJobCard
                    key={job.id}
                    job={job}
                    matchTier={matchTiers[job.id]}
                  />
                ))}
              </div>
              {hasMore ? (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    disabled={loadingMore}
                    onClick={() => void loadJobs(state, "append")}
                    className="inline-flex h-10 items-center justify-center rounded-[var(--radius-button)] border border-border bg-card px-5 text-sm font-semibold text-text transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:opacity-60"
                  >
                    {loadingMore ? "Loading…" : "Load More"}
                  </button>
                </div>
              ) : null}
            </>
          ) : activeFilterCount || state.keyword || state.location ? (
            <JobEmptyState
              title="No jobs match your search."
              description="Try adjusting your keywords or filters."
              actionLabel="Clear Filters"
              onAction={clearFilters}
            />
          ) : (
            <JobEmptyState
              title="No SAP jobs are available right now."
              description="Check back soon — new roles are posted by employers regularly."
            />
          )}
        </div>
      </div>

      <JobFilterDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        state={state}
        onChange={updateFilters}
        onClear={clearFilters}
      />
    </div>
  );
}
