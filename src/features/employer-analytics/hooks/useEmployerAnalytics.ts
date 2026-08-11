"use client";

import { useCallback, useEffect, useState } from "react";
import { analyticsService } from "../services/analyticsService";
import type {
  AnalyticsFilters,
  EmployerAnalyticsData,
} from "../types/analytics.types";

type LoadState = "idle" | "loading" | "success" | "error";

const DEFAULT_FILTERS: AnalyticsFilters = {
  dateRange: "30d",
  jobId: "all",
};

export function useEmployerAnalytics(
  initialFilters: AnalyticsFilters = DEFAULT_FILTERS,
) {
  const [filters, setFilters] = useState<AnalyticsFilters>(initialFilters);
  const [data, setData] = useState<EmployerAnalyticsData | null>(null);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextFilters: AnalyticsFilters) => {
    setStatus("loading");
    setError(null);
    const result = await analyticsService.getAnalytics(nextFilters);
    if (!result.success) {
      setData(null);
      setError(result.error);
      setStatus("error");
      return;
    }
    setData(result.data);
    setStatus("success");
  }, []);

  useEffect(() => {
    void load(filters);
  }, [filters, load]);

  const updateFilters = useCallback((patch: Partial<AnalyticsFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  return {
    filters,
    updateFilters,
    setFilters,
    data,
    isLoading: status === "loading" || status === "idle",
    isError: status === "error",
    error,
    reload: () => void load(filters),
  };
}
