"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { ApplicantCard } from "../components/ApplicantCard";
import { ApplicantEmptyState } from "../components/ApplicantEmptyState";
import { ApplicantFilters } from "../components/ApplicantFilters";
import { ApplicantSummaryCards } from "../components/ApplicantSummaryCards";
import { ApplicantTable } from "../components/ApplicantTable";
import { ApplicantTableSkeleton } from "../components/ApplicantSkeletons";
import { ChangeApplicationStatusDialog } from "../components/ChangeApplicationStatusDialog";
import { RejectApplicationDialog } from "../components/RejectApplicationDialog";
import { EMPLOYER_APPLICANT_ROUTES } from "../constants";
import { useApplicationMutations } from "../hooks/useApplicationMutations";
import { useApplications } from "../hooks/useApplications";
import type {
  ApplicationSortOption,
  ApplicationStatusFilter,
} from "../types/application.types";

export function ApplicantsPage({
  lockedStatus,
  pageTitle = "Applicants",
  pageSubtitle = "Review and manage candidates who applied to your jobs.",
}: {
  lockedStatus?: ApplicationStatusFilter;
  pageTitle?: string;
  pageSubtitle?: string;
}) {
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get("job") ?? "";

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ApplicationStatusFilter>(
    lockedStatus ?? "all",
  );
  const [sort, setSort] = useState<ApplicationSortOption>("newest");
  const [jobId, setJobId] = useState(initialJobId);
  const [experience, setExperience] = useState("all");
  const [location, setLocation] = useState("");

  useEffect(() => {
    if (lockedStatus) {
      setStatus(lockedStatus);
    }
  }, [lockedStatus]);

  useEffect(() => {
    setJobId(searchParams.get("job") ?? "");
  }, [searchParams]);

  const query = useMemo(
    () => ({
      search,
      status: lockedStatus ?? status,
      sort,
      jobId,
      experience,
      location,
    }),
    [search, lockedStatus, status, sort, jobId, experience, location],
  );

  const {
    applications,
    allApplications,
    stats,
    jobOptions,
    locations,
    isLoading,
    isError,
    error,
    reload,
  } = useApplications(query);

  const {
    confirmOpen,
    confirmTarget,
    confirmLoading,
    rejectReason,
    setRejectReason,
    closeConfirm,
    confirmReject,
    statusDialog,
    statusLoading,
    closeStatusDialog,
    updateStatusFromDialog,
    handleAction,
  } = useApplicationMutations(() => void reload());

  const hasFilters =
    Boolean(search.trim()) ||
    (lockedStatus ? false : status !== "all") ||
    Boolean(jobId) ||
    experience !== "all" ||
    Boolean(location);

  const emptyVariant = (() => {
    if (lockedStatus === "shortlisted" && !hasFilters) {
      return "no-shortlisted" as const;
    }
    if (allApplications.length === 0) return "no-applicants" as const;
    if (jobId && !hasFiltersExceptJob()) return "no-job-applicants" as const;
    return "no-results" as const;
  })();

  function hasFiltersExceptJob() {
    return (
      Boolean(search.trim()) ||
      (lockedStatus ? false : status !== "all") ||
      experience !== "all" ||
      Boolean(location)
    );
  }

  const clearFilters = () => {
    setSearch("");
    if (!lockedStatus) setStatus("all");
    setJobId("");
    setExperience("all");
    setLocation("");
    setSort("newest");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            {pageTitle}
          </h1>
          <p className="mt-1 text-sm text-muted">{pageSubtitle}</p>
        </div>
        <Button href={EMPLOYER_APPLICANT_ROUTES.talentSearch} variant="secondary">
          <Search size={16} aria-hidden="true" />
          Find Candidates
        </Button>
      </div>

      {!lockedStatus ? <ApplicantSummaryCards stats={stats} /> : null}

      <ApplicantFilters
        search={search}
        status={lockedStatus ?? status}
        sort={sort}
        jobId={jobId}
        experience={experience}
        location={location}
        jobOptions={jobOptions}
        locations={locations}
        resultCount={isLoading || isError ? undefined : applications.length}
        statusLocked={Boolean(lockedStatus)}
        onSearchChange={setSearch}
        onStatusChange={(value) => {
          if (!lockedStatus) setStatus(value);
        }}
        onSortChange={setSort}
        onJobChange={setJobId}
        onExperienceChange={setExperience}
        onLocationChange={setLocation}
        onClearAll={clearFilters}
      />

      {isLoading ? <ApplicantTableSkeleton /> : null}

      {isError ? (
        <ErrorState
          title="Unable to load applicants."
          description={error ?? undefined}
          onRetry={() => void reload()}
        />
      ) : null}

      {!isLoading && !isError && applications.length === 0 ? (
        <ApplicantEmptyState
          variant={emptyVariant}
          onClearSearch={hasFilters ? clearFilters : undefined}
        />
      ) : null}

      {!isLoading && !isError && applications.length > 0 ? (
        <>
          <ApplicantTable
            applications={applications}
            onAction={handleAction}
            showScheduleInterview={lockedStatus === "shortlisted"}
          />
          <div className="grid gap-3 md:hidden">
            {applications.map((application) => (
              <ApplicantCard
                key={application.id}
                application={application}
                onAction={handleAction}
                showScheduleInterview={lockedStatus === "shortlisted"}
              />
            ))}
          </div>
        </>
      ) : null}

      <RejectApplicationDialog
        open={confirmOpen}
        application={confirmTarget}
        reason={rejectReason}
        loading={confirmLoading}
        onReasonChange={setRejectReason}
        onCancel={closeConfirm}
        onConfirm={() => void confirmReject()}
      />

      <ChangeApplicationStatusDialog
        open={statusDialog.open}
        application={statusDialog.application}
        loading={statusLoading}
        onCancel={closeStatusDialog}
        onConfirm={(nextStatus, notes) =>
          void updateStatusFromDialog(nextStatus, notes)
        }
      />
    </div>
  );
}
