"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { EmployerConversionBanner } from "./EmployerConversionBanner";
import { PublicTalentCard } from "./PublicTalentCard";
import { PublicTalentFilters } from "./PublicTalentFilters";
import { PublicTalentPreviewModal } from "./PublicTalentPreviewModal";
import { PublicTalentSearchBar } from "./PublicTalentSearchBar";
import { PublicTalentToolbar } from "./PublicTalentToolbar";
import { publicTalentService } from "../services/publicTalentService";
import type {
  PublicExperienceBand,
  PublicTalentCandidate,
  PublicTalentSearchFilters,
  PublicTalentSearchResult,
  PublicTalentSort,
  PublicWorkMode,
} from "../types/publicTalent.types";

const INITIAL_FILTERS: PublicTalentSearchFilters = {
  keyword: "",
  type: null,
  modules: [],
  skills: [],
  experienceBands: [],
  locations: [],
  workModes: [],
  availability: [],
};

const PAGE_SIZE = 9;

export function PublicTalentSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize filters from URL search params
  const [filters, setFilters] = useState<PublicTalentSearchFilters>(() => {
    const typeParam = searchParams.get("type");
    const moduleParam = searchParams.get("module");
    const keywordParam = searchParams.get("keyword") || searchParams.get("q");
    const locationParam = searchParams.get("location");
    const workModeParam = searchParams.get("workMode");

    return {
      keyword: keywordParam || "",
      type: typeParam || null,
      modules: moduleParam ? [moduleParam] : [],
      skills: [],
      experienceBands: [],
      locations: locationParam ? [locationParam] : [],
      workModes: workModeParam ? [workModeParam as PublicWorkMode] : [],
      availability: [],
    };
  });

  const [sort, setSort] = useState<PublicTalentSort>("relevance");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [previewCandidate, setPreviewCandidate] = useState<PublicTalentCandidate | null>(null);

  const [result, setResult] = useState<PublicTalentSearchResult>({
    items: [],
    total: 0,
    page: 1,
    pageSize: PAGE_SIZE,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  // Sync URL when filter changes
  useEffect(() => {
    const typeParam = searchParams.get("type");
    const moduleParam = searchParams.get("module");
    const keywordParam = searchParams.get("keyword") || searchParams.get("q");

    setFilters((prev) => ({
      ...prev,
      type: typeParam || prev.type,
      keyword: keywordParam !== null ? keywordParam : prev.keyword,
      modules: moduleParam && !prev.modules.includes(moduleParam) ? [...prev.modules, moduleParam] : prev.modules,
    }));
  }, [searchParams]);

  // Fetch candidates based on current filters and pagination
  const fetchTalent = useCallback(async () => {
    setLoading(true);
    try {
      const data = await publicTalentService.searchCandidates({
        filters,
        sort,
        page,
        pageSize: PAGE_SIZE,
      });
      setResult(data);
    } catch {
      // Error fallback handled by service
    } finally {
      setLoading(false);
    }
  }, [filters, sort, page]);

  useEffect(() => {
    void fetchTalent();
  }, [fetchTalent]);

  const handleFilterChange = (updated: Partial<PublicTalentSearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
    router.replace("/talent-hub/search");
  };

  const handleToggleModule = (mod: string) => {
    setFilters((prev) => {
      const next = prev.modules.includes(mod)
        ? prev.modules.filter((m) => m !== mod)
        : [...prev.modules, mod];
      return { ...prev, modules: next };
    });
    setPage(1);
  };

  const handleRemoveFilter = (key: keyof PublicTalentSearchFilters, value?: string) => {
    setFilters((prev) => {
      if (key === "keyword") return { ...prev, keyword: "" };
      if (key === "type") return { ...prev, type: null };
      if (Array.isArray(prev[key])) {
        return {
          ...prev,
          [key]: (prev[key] as string[]).filter((item) => item !== value),
        };
      }
      return prev;
    });
    setPage(1);
  };

  const activeFilterCount =
    (filters.type ? 1 : 0) +
    filters.modules.length +
    filters.experienceBands.length +
    filters.workModes.length +
    filters.locations.length +
    (filters.keyword ? 1 : 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Breadcrumb & Page Header */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-muted" aria-label="Breadcrumb">
          <Link href="/talent-hub" className="hover:text-primary transition">
            Talent Hub
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-text">Talent Search</span>
        </nav>

        <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text">
              Discover <span className="text-primary">SAP Talent</span>
            </h1>
            <p className="mt-1 text-sm text-muted">
              Browse verified SAP professionals, consultants, developers, and architects across modules.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/employer/login"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-primary/90"
            >
              <Building2 size={13} aria-hidden="true" />
              <span>Employer Sign In</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Search & Quick Filters */}
      <PublicTalentSearchBar
        keyword={filters.keyword}
        onKeywordChange={(val) => handleFilterChange({ keyword: val })}
        activeFilterCount={activeFilterCount}
        onOpenMobileFilters={() => setMobileFilterOpen(true)}
        selectedModules={filters.modules}
        onToggleModule={handleToggleModule}
      />

      {/* Main Layout: Filters Sidebar + Results */}
      <div className="flex gap-8 items-start">
        {/* Filter Sidebar */}
        <PublicTalentFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          isMobileOpen={mobileFilterOpen}
          onCloseMobile={() => setMobileFilterOpen(false)}
        />

        {/* Results Stream */}
        <div className="flex-1 min-w-0 space-y-6">
          <PublicTalentToolbar
            total={result.total}
            sort={sort}
            onSortChange={setSort}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filters={filters}
            onRemoveFilter={handleRemoveFilter}
          />

          {/* Results Grid / List */}
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-72 animate-pulse rounded-[var(--radius-card)] border border-border bg-card/60 p-5"
                />
              ))}
            </div>
          ) : result.items.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-card p-10 text-center shadow-soft">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Search size={22} aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-bold text-text">No SAP talent matches found</h3>
              <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
                Try broadening your search keywords or resetting specific module or experience filters.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-5 inline-flex items-center gap-1.5 rounded-[var(--radius-button)] bg-primary px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-primary/90"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
                  : "space-y-4"
              }
            >
              {result.items.map((candidate) => (
                <PublicTalentCard
                  key={candidate.id}
                  candidate={candidate}
                  onPreview={setPreviewCandidate}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {result.totalPages > 1 ? (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-card px-3 text-xs font-medium text-text shadow-xs disabled:opacity-40 hover:bg-surface transition"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              <span className="px-3 text-xs font-semibold text-muted">
                Page {result.page} of {result.totalPages}
              </span>

              <button
                type="button"
                disabled={page >= result.totalPages}
                onClick={() => setPage((p) => Math.min(result.totalPages, p + 1))}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-card px-3 text-xs font-medium text-text shadow-xs disabled:opacity-40 hover:bg-surface transition"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          ) : null}

          {/* Employer Conversion Banner */}
          <div className="pt-4">
            <EmployerConversionBanner />
          </div>
        </div>
      </div>

      {/* Controlled Profile Preview Modal */}
      <PublicTalentPreviewModal
        candidate={previewCandidate}
        onClose={() => setPreviewCandidate(null)}
      />
    </div>
  );
}
