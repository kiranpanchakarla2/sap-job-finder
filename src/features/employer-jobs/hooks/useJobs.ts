"use client";

import { useCallback, useEffect, useState } from "react";
import { filterAndSortJobs } from "../lib/filterJobs";
import { jobService } from "../services/jobService";
import type {
  EmployerJobRecord,
  JobSortOption,
  JobStatusFilter,
} from "../types/job.types";

type LoadState = "idle" | "loading" | "success" | "error";

export function useJobs(params: {
  search: string;
  status: JobStatusFilter;
  sort: JobSortOption;
}) {
  const [allJobs, setAllJobs] = useState<EmployerJobRecord[]>([]);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    const result = await jobService.listJobs();
    if (!result.success) {
      setError(result.error);
      setAllJobs([]);
      setStatus("error");
      return;
    }
    setAllJobs(result.data);
    setStatus("success");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const jobs = filterAndSortJobs(allJobs, params);

  return {
    jobs,
    isLoading: status === "loading" || status === "idle",
    isError: status === "error",
    error,
    reload: load,
  };
}
