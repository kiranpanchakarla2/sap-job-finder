"use client";

import { useCallback, useEffect, useState } from "react";
import { useEmployerAuth } from "@/features/employer-auth";
import { employerDashboardService } from "../services/employerDashboardService";
import type { EmployerDashboardData } from "../types/dashboard.types";

type LoadState = "idle" | "loading" | "success" | "error";

export function useEmployerDashboard() {
  const { employer, isLoading: authLoading } = useEmployerAuth();
  const [data, setData] = useState<EmployerDashboardData | null>(null);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!employer?.id) {
      setData(null);
      setStatus("idle");
      return;
    }

    setStatus("loading");
    setError(null);
    const result = await employerDashboardService.getDashboard(employer.id);
    if (!result.success) {
      setError(result.error);
      setStatus("error");
      setData(null);
      return;
    }
    setData(result.data);
    setStatus("success");
  }, [employer?.id]);

  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [authLoading, load]);

  return {
    data,
    employer,
    isLoading: authLoading || status === "loading" || status === "idle",
    isError: status === "error",
    error,
    reload: load,
  };
}
