"use client";

import { useCallback, useEffect, useState } from "react";
import { jobService } from "../services/jobService";
import type { EmployerJobRecord } from "../types/job.types";

type LoadState = "idle" | "loading" | "success" | "error";

export function useJob(jobId: string | undefined) {
  const [job, setJob] = useState<EmployerJobRecord | null>(null);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!jobId) {
      setJob(null);
      setStatus("error");
      setError("Job not found.");
      return;
    }

    setStatus("loading");
    setError(null);
    const result = await jobService.getJob(jobId);
    if (!result.success) {
      setJob(null);
      setError(result.error);
      setStatus("error");
      return;
    }
    setJob(result.data);
    setStatus("success");
  }, [jobId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    job,
    isLoading: status === "loading" || status === "idle",
    isError: status === "error",
    error,
    reload: load,
    setJob,
  };
}
