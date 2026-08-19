"use client";

/**
 * useAdminDashboard Hook
 * Sprint 10B: Manages Super Admin Dashboard state, date range filters, loading, and refreshing.
 */

import { useCallback, useEffect, useState } from "react";
import {
  calculateDateRange,
  fetchFullDashboardData,
} from "../services/adminDashboardService";
import type {
  DashboardData,
  DashboardErrors,
  DateRangeFilter,
  DateRangeOption,
} from "../types/dashboard.types";

export function useAdminDashboard(initialOption: DateRangeOption = "30d") {
  const [dateRange, setDateRange] = useState<DateRangeFilter>(() =>
    calculateDateRange(initialOption),
  );
  const [data, setData] = useState<DashboardData | null>(null);
  const [errors, setErrors] = useState<DashboardErrors>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (filter: DateRangeFilter, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await fetchFullDashboardData(filter);
      setData(result.data);
      setErrors(result.errors);
    } catch (err: unknown) {
      console.error("[useAdminDashboard] Failed to fetch dashboard data:", err);
      setErrors({
        users: "Failed to connect to database",
        subscriptions: "Failed to connect to database",
        payments: "Failed to connect to database",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch when date range changes
  useEffect(() => {
    loadData(dateRange, false);
  }, [dateRange, loadData]);

  const changeDateRange = useCallback(
    (option: DateRangeOption, customStart?: string, customEnd?: string) => {
      const newFilter = calculateDateRange(option, customStart, customEnd);
      setDateRange(newFilter);
    },
    [],
  );

  const refresh = useCallback(() => {
    loadData(dateRange, true);
  }, [dateRange, loadData]);

  return {
    dateRange,
    changeDateRange,
    data,
    errors,
    loading,
    refreshing,
    refresh,
  };
}
