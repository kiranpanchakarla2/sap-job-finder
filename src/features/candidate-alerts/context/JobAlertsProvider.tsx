"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";
import { candidateJobAlertService } from "../services/candidateJobAlertService";
import type { JobAlert, JobAlertInput } from "../types/alert.types";

type JobAlertsContextValue = {
  alerts: JobAlert[];
  activeAlertsCount: number;
  totalAlertsCount: number;
  loading: boolean;
  createAlert: (input: JobAlertInput) => Promise<boolean>;
  updateAlert: (id: string, input: JobAlertInput) => Promise<boolean>;
  togglePauseAlert: (id: string) => Promise<void>;
  deleteAlert: (id: string) => Promise<boolean>;
  refreshAlerts: () => Promise<void>;
};

const JobAlertsContext = createContext<JobAlertsContextValue | null>(null);

export function JobAlertsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isCandidate = Boolean(
    isAuthenticated && user && (user.role === "candidate" || user.role === "admin"),
  );
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshAlerts = useCallback(async () => {
    if (!isCandidate || !user?.id) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const result = await candidateJobAlertService.getAlerts();
    if (result.success) {
      setAlerts(result.data);
    } else {
      if (result.code !== "NO_CANDIDATE" && result.code !== "UNAUTHENTICATED") {
        toast.error(result.error);
      }
    }
    setLoading(false);
  }, [isCandidate, user?.id]);

  useEffect(() => {
    if (authLoading) return;
    void refreshAlerts();
  }, [authLoading, refreshAlerts]);

  const activeAlertsCount = useMemo(
    () => alerts.filter((a) => a.status === "active").length,
    [alerts],
  );

  const createAlert = useCallback(
    async (input: JobAlertInput): Promise<boolean> => {
      const result = await candidateJobAlertService.createAlert(input);
      if (!result.success) {
        toast.error(result.error);
        return false;
      }
      setAlerts((prev) => [result.data, ...prev]);
      toast.success("Job alert created successfully.");
      return true;
    },
    [],
  );

  const updateAlert = useCallback(
    async (id: string, input: JobAlertInput): Promise<boolean> => {
      const result = await candidateJobAlertService.updateAlert(id, input);
      if (!result.success) {
        toast.error(result.error);
        return false;
      }
      setAlerts((prev) =>
        prev.map((alert) => (alert.id === id ? result.data : alert)),
      );
      toast.success("Job alert updated successfully.");
      return true;
    },
    [],
  );

  const togglePauseAlert = useCallback(async (id: string) => {
    const alert = alerts.find((a) => a.id === id);
    if (!alert) return;

    const newStatus = alert.status === "active" ? "paused" : "active";
    // Optimistic update
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)),
    );

    const result = await candidateJobAlertService.togglePauseAlert(id);
    if (!result.success) {
      // Revert on failure
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: alert.status } : a)),
      );
      toast.error(result.error);
      return;
    }

    if (newStatus === "paused") {
      toast.success("Job alert paused.");
    } else {
      toast.success("Job alert resumed.");
    }
  }, [alerts]);

  const deleteAlert = useCallback(
    async (id: string): Promise<boolean> => {
      const previous = alerts;
      // Optimistic removal
      setAlerts((prev) => prev.filter((a) => a.id !== id));

      const result = await candidateJobAlertService.deleteAlert(id);
      if (!result.success) {
        setAlerts(previous);
        toast.error(result.error);
        return false;
      }
      toast.success("Job alert deleted.");
      return true;
    },
    [alerts],
  );

  const value = useMemo<JobAlertsContextValue>(
    () => ({
      alerts,
      activeAlertsCount,
      totalAlertsCount: alerts.length,
      loading,
      createAlert,
      updateAlert,
      togglePauseAlert,
      deleteAlert,
      refreshAlerts,
    }),
    [
      alerts,
      activeAlertsCount,
      loading,
      createAlert,
      updateAlert,
      togglePauseAlert,
      deleteAlert,
      refreshAlerts,
    ],
  );

  return (
    <JobAlertsContext.Provider value={value}>
      {children}
    </JobAlertsContext.Provider>
  );
}

export function useJobAlerts() {
  const ctx = useContext(JobAlertsContext);
  if (!ctx) {
    throw new Error("useJobAlerts must be used within JobAlertsProvider");
  }
  return ctx;
}
