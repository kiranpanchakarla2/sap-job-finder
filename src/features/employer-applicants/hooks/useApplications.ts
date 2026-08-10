"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { applicationService } from "../services/applicationService";
import type {
  ApplicationQuery,
  ApplicationSummaryStats,
  EmployerApplication,
  JobFilterOption,
} from "../types/application.types";
import { getUniqueLocations } from "../lib/filterApplications";

type LoadState = "idle" | "loading" | "success" | "error";

const emptyStats: ApplicationSummaryStats = {
  total: 0,
  new: 0,
  reviewing: 0,
  shortlisted: 0,
  interview: 0,
  hired: 0,
  rejected: 0,
};

export function useApplications(query: ApplicationQuery = {}) {
  const [applications, setApplications] = useState<EmployerApplication[]>([]);
  const [allApplications, setAllApplications] = useState<EmployerApplication[]>(
    [],
  );
  const [stats, setStats] = useState<ApplicationSummaryStats>(emptyStats);
  const [jobOptions, setJobOptions] = useState<JobFilterOption[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);

  const queryKey = useMemo(
    () =>
      JSON.stringify({
        search: query.search ?? "",
        status: query.status ?? "all",
        jobId: query.jobId ?? "",
        experience: query.experience ?? "all",
        location: query.location ?? "",
        sort: query.sort ?? "newest",
      }),
    [query],
  );

  const reload = useCallback(async () => {
    setLoadState("loading");
    setError(null);

    const parsed = JSON.parse(queryKey) as ApplicationQuery;
    const [listResult, allResult, statsResult, jobsResult] = await Promise.all([
      applicationService.listApplications(parsed),
      applicationService.listApplications({ sort: "newest" }),
      applicationService.getStats(),
      applicationService.getJobOptions(),
    ]);

    if (!listResult.success) {
      setLoadState("error");
      setError(listResult.error);
      setApplications([]);
      return;
    }

    setApplications(listResult.data);
    setAllApplications(allResult.success ? allResult.data : listResult.data);
    setStats(statsResult.success ? statsResult.data : emptyStats);
    setJobOptions(jobsResult.success ? jobsResult.data : []);
    setLoadState("success");
  }, [queryKey]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const locations = useMemo(
    () => getUniqueLocations(allApplications),
    [allApplications],
  );

  return {
    applications,
    allApplications,
    stats,
    jobOptions,
    locations,
    isLoading: loadState === "loading" || loadState === "idle",
    isError: loadState === "error",
    error,
    reload,
  };
}

export function useApplication(id: string) {
  const [application, setApplication] = useState<EmployerApplication | null>(
    null,
  );
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoadState("loading");
    setError(null);

    const result = await applicationService.getApplication(id);
    if (!result.success) {
      setApplication(null);
      setLoadState("error");
      setError(result.error);
      return;
    }

    if (!result.data) {
      setApplication(null);
      setLoadState("error");
      setError("Applicant not found.");
      return;
    }

    setApplication(result.data);
    setLoadState("success");
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    application,
    isLoading: loadState === "loading" || loadState === "idle",
    isError: loadState === "error",
    error,
    reload,
  };
}

export function useJobApplications(jobId: string) {
  return useApplications({ jobId, sort: "newest" });
}
