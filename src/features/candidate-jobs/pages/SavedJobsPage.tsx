"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, Filter, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { useApplications } from "@/features/candidate-applications";
import { useSavedJobs } from "../context/SavedJobsProvider";
import { DiscoveryJobCard } from "../components/DiscoveryJobCard";
import { JobListSkeleton } from "../components/JobStates";
import {
  EXPERIENCE_FILTER_OPTIONS,
  LOCATION_FILTER_OPTIONS,
  WORK_MODE_OPTIONS,
} from "../constants";
import type { DiscoveryJob } from "../types/job.types";

type SavedJobSort =
  | "recently_saved"
  | "recently_posted"
  | "salary_high"
  | "salary_low"
  | "title_asc";

type StatusFilter = "all" | "not_applied" | "applied" | "closed";

export function SavedJobsPage() {
  const { savedJobs, removeSaved, savedCount, loading } = useSavedJobs();
  const { getApplicationByJobId } = useApplications();

  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  const [workModeFilter, setWorkModeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOption, setSortOption] = useState<SavedJobSort>("recently_saved");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count += 1;
    if (locationFilter) count += 1;
    if (experienceFilter) count += 1;
    if (workModeFilter) count += 1;
    if (statusFilter !== "all") count += 1;
    return count;
  }, [searchQuery, locationFilter, experienceFilter, workModeFilter, statusFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setLocationFilter("");
    setExperienceFilter("");
    setWorkModeFilter("");
    setStatusFilter("all");
    setSortOption("recently_saved");
  };

  const filteredJobs = useMemo(() => {
    return savedJobs
      .filter((job) => {
        // Keyword Search (Title, Company, Skills, Location, SAP Modules)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = job.title.toLowerCase().includes(q);
          const matchCompany = job.companyName.toLowerCase().includes(q);
          const matchLocation = job.location.toLowerCase().includes(q);
          const matchSkills = job.requiredSkills.some((s) => s.toLowerCase().includes(q));
          const matchModules = job.sapModules.some((m) => m.toLowerCase().includes(q));
          if (!matchTitle && !matchCompany && !matchLocation && !matchSkills && !matchModules) {
            return false;
          }
        }

        // Location Filter
        if (locationFilter) {
          const loc = locationFilter.toLowerCase();
          if (!job.location.toLowerCase().includes(loc)) {
            return false;
          }
        }

        // Experience Filter
        if (experienceFilter) {
          if (
            !job.experienceLabel.toLowerCase().includes(experienceFilter.toLowerCase()) &&
            !experienceFilter.toLowerCase().includes(String(job.experienceMin))
          ) {
            return false;
          }
        }

        // Work Mode Filter
        if (workModeFilter) {
          if (job.workMode !== workModeFilter) {
            return false;
          }
        }

        // Status Filter
        if (statusFilter !== "all") {
          const isClosed = job.status === "closed";
          const isApplied = Boolean(getApplicationByJobId(job.id));

          if (statusFilter === "closed" && !isClosed) return false;
          if (statusFilter === "applied" && !isApplied) return false;
          if (statusFilter === "not_applied" && (isApplied || isClosed)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortOption) {
          case "recently_posted":
            return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
          case "salary_high":
            return (b.salaryMax ?? b.salaryMin ?? 0) - (a.salaryMax ?? a.salaryMin ?? 0);
          case "salary_low":
            return (a.salaryMin ?? a.salaryMax ?? 0) - (b.salaryMin ?? b.salaryMax ?? 0);
          case "title_asc":
            return a.title.localeCompare(b.title);
          case "recently_saved":
          default:
            return (
              new Date((b as { savedAt?: string }).savedAt ?? b.postedAt).getTime() -
              new Date((a as { savedAt?: string }).savedAt ?? a.postedAt).getTime()
            );
        }
      });
  }, [savedJobs, searchQuery, locationFilter, experienceFilter, workModeFilter, statusFilter, sortOption, getApplicationByJobId]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Saved Jobs
          </h1>
          <p className="mt-1 text-sm text-muted">
            Jobs you&apos;ve saved for later.
            {savedCount > 0 ? ` · ${savedCount} saved ${savedCount === 1 ? "job" : "jobs"}` : ""}
          </p>
        </div>
        {savedJobs.length > 0 && (
          <Button href="/candidate/jobs" variant="secondary" className="!h-10">
            Find More Jobs
          </Button>
        )}
      </header>

      {/* Main Content */}
      {loading ? (
        <JobListSkeleton count={3} />
      ) : savedJobs.length === 0 ? (
        /* Empty State: No saved jobs at all */
        <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-card px-6 py-16 text-center shadow-soft">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Bookmark size={26} aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-text">No saved jobs yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Save interesting SAP opportunities and come back to them later.
          </p>
          <Button href="/candidate/jobs" variant="primary" className="mt-6 !h-10 px-5">
            Find Jobs
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-soft">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Search input */}
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, company, skills, or location…"
                  className="w-full rounded-[var(--radius-control)] border border-border bg-surface/40 py-2 pl-9 pr-8 text-sm text-text placeholder:text-muted/60 focus:border-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                    aria-label="Clear search query"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Mobile Filter Toggle */}
              <div className="flex items-center gap-2 lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen((prev) => !prev)}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-border bg-card px-3 text-xs font-semibold text-text"
                >
                  <Filter size={14} />
                  <span>Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ""}</span>
                </button>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex h-9 items-center gap-1 rounded-[var(--radius-control)] border border-border px-3 text-xs font-semibold text-muted hover:text-text"
                  >
                    <RotateCcw size={12} />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Desktop Filters Row */}
              <div className="hidden flex-wrap items-center gap-2 lg:flex">
                {/* Location */}
                <NativeSelect
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="rounded-[var(--radius-control)] border border-border bg-card px-3 py-1.5 text-xs text-text"
                  aria-label="Filter by location"
                >
                  <option value="">All Locations</option>
                  {LOCATION_FILTER_OPTIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </NativeSelect>

                {/* Experience */}
                <NativeSelect
                  value={experienceFilter}
                  onChange={(e) => setExperienceFilter(e.target.value)}
                  className="rounded-[var(--radius-control)] border border-border bg-card px-3 py-1.5 text-xs text-text"
                  aria-label="Filter by experience"
                >
                  <option value="">All Experience</option>
                  {EXPERIENCE_FILTER_OPTIONS.map((exp) => (
                    <option key={exp} value={exp}>
                      {exp}
                    </option>
                  ))}
                </NativeSelect>

                {/* Work Mode */}
                <NativeSelect
                  value={workModeFilter}
                  onChange={(e) => setWorkModeFilter(e.target.value)}
                  className="rounded-[var(--radius-control)] border border-border bg-card px-3 py-1.5 text-xs text-text"
                  aria-label="Filter by work mode"
                >
                  <option value="">All Work Modes</option>
                  {WORK_MODE_OPTIONS.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </NativeSelect>

                {/* Status Filter */}
                <NativeSelect
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="rounded-[var(--radius-control)] border border-border bg-card px-3 py-1.5 text-xs text-text"
                  aria-label="Filter by status"
                >
                  <option value="all">All Statuses</option>
                  <option value="not_applied">Not Applied</option>
                  <option value="applied">Applied</option>
                  <option value="closed">Closed</option>
                </NativeSelect>

                {/* Clear button */}
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-control)] px-2.5 text-xs font-semibold text-muted transition hover:bg-surface hover:text-text"
                  >
                    <RotateCcw size={12} />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Filter Drawer / Collapsible */}
            {mobileFiltersOpen && (
              <div className="mt-3 grid gap-2.5 border-t border-border/60 pt-3 sm:grid-cols-2 lg:hidden">
                <div>
                  <label className="text-[11px] font-semibold text-muted">Location</label>
                  <NativeSelect
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="mt-1 w-full rounded-[var(--radius-control)] border border-border bg-card px-3 py-1.5 text-xs text-text"
                  >
                    <option value="">All Locations</option>
                    {LOCATION_FILTER_OPTIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted">Experience</label>
                  <NativeSelect
                    value={experienceFilter}
                    onChange={(e) => setExperienceFilter(e.target.value)}
                    className="mt-1 w-full rounded-[var(--radius-control)] border border-border bg-card px-3 py-1.5 text-xs text-text"
                  >
                    <option value="">All Experience</option>
                    {EXPERIENCE_FILTER_OPTIONS.map((exp) => (
                      <option key={exp} value={exp}>
                        {exp}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted">Work Mode</label>
                  <NativeSelect
                    value={workModeFilter}
                    onChange={(e) => setWorkModeFilter(e.target.value)}
                    className="mt-1 w-full rounded-[var(--radius-control)] border border-border bg-card px-3 py-1.5 text-xs text-text"
                  >
                    <option value="">All Work Modes</option>
                    {WORK_MODE_OPTIONS.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted">Status</label>
                  <NativeSelect
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="mt-1 w-full rounded-[var(--radius-control)] border border-border bg-card px-3 py-1.5 text-xs text-text"
                  >
                    <option value="all">All Statuses</option>
                    <option value="not_applied">Not Applied</option>
                    <option value="applied">Applied</option>
                    <option value="closed">Closed</option>
                  </NativeSelect>
                </div>
              </div>
            )}
          </div>

          {/* Results Count and Sorting Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="text-xs text-muted">
              Showing <span className="font-semibold text-text">{filteredJobs.length}</span> of{" "}
              <span className="font-semibold text-text">{savedJobs.length}</span> saved{" "}
              {savedJobs.length === 1 ? "job" : "jobs"}
            </p>

            <label className="flex items-center gap-2 text-xs text-muted">
              <span className="whitespace-nowrap font-medium">Sort by</span>
              <NativeSelect
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SavedJobSort)}
                className="rounded-[var(--radius-control)] border border-border bg-card px-2.5 py-1 text-xs text-text"
                aria-label="Sort saved jobs"
              >
                <option value="recently_saved">Recently Saved</option>
                <option value="recently_posted">Recently Posted</option>
                <option value="salary_high">Salary: High to Low</option>
                <option value="salary_low">Salary: Low to High</option>
                <option value="title_asc">Job Title: A-Z</option>
              </NativeSelect>
            </label>
          </div>

          {/* Saved Job Cards List */}
          {filteredJobs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredJobs.map((job) => (
                <DiscoveryJobCard
                  key={job.id}
                  job={job}
                  savedAt={(job as { savedAt?: string }).savedAt}
                  showRemove
                  onRemove={(id) => void removeSaved(id)}
                  showClosedBadge={job.status === "closed"}
                  showApplyNow
                />
              ))}
            </div>
          ) : (
            /* Empty State: Filter yielded no results */
            <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-card px-6 py-12 text-center shadow-soft">
              <p className="text-base font-semibold text-text">No saved jobs match your filters.</p>
              <p className="mt-1 text-sm text-muted">
                Try clearing search terms or selecting different filter criteria.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] border border-border bg-card px-4 text-xs font-semibold text-text hover:border-primary/30"
              >
                <RotateCcw size={13} />
                <span>Clear Filters</span>
              </button>
            </div>
          )}

          {/* Bottom Explore Link */}
          {filteredJobs.length > 0 && (
            <p className="pt-2 text-center text-xs text-muted">
              Looking for more SAP roles?{" "}
              <Link
                href="/candidate/jobs"
                className="font-semibold text-primary hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                Explore SAP Jobs →
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
