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
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";
import { jobDetailsHref, resolveJobsBasePath } from "../lib/jobsBasePath";
import { candidateSavedJobService } from "../services/candidateSavedJobService";
import type { DiscoveryJob } from "../types/job.types";

type SavedJobsContextValue = {
  savedIds: Set<string>;
  savedCount: number;
  savedJobs: DiscoveryJob[];
  loading: boolean;
  isSaved: (jobId: string) => boolean;
  toggleSave: (jobId: string) => Promise<void>;
  removeSaved: (jobId: string) => Promise<void>;
  refreshSaved: () => Promise<void>;
};

const SavedJobsContext = createContext<SavedJobsContextValue | null>(null);

export function SavedJobsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isCandidate = Boolean(
    isAuthenticated && user && (user.role === "candidate" || user.role === "admin"),
  );
  const router = useRouter();
  const pathname = usePathname();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savedJobs, setSavedJobs] = useState<DiscoveryJob[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshSaved = useCallback(async () => {
    if (!isCandidate || !user?.id) {
      setSavedIds([]);
      setSavedJobs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [idsResult, jobsResult] = await Promise.all([
      candidateSavedJobService.getSavedJobIds(),
      candidateSavedJobService.getSavedJobs(),
    ]);

    if (idsResult.success) setSavedIds(idsResult.data);
    if (jobsResult.success) setSavedJobs(jobsResult.data);
    setLoading(false);
  }, [isCandidate, user?.id]);

  useEffect(() => {
    if (authLoading) return;
    void refreshSaved();
  }, [authLoading, refreshSaved]);

  const idSet = useMemo(() => new Set(savedIds), [savedIds]);
  const isSaved = useCallback((jobId: string) => idSet.has(jobId), [idSet]);

  const toggleSave = useCallback(
    async (jobId: string) => {
      if (!isAuthenticated) {
        toast.message("Sign in to save jobs.", {
          description: "Create or sign in to your candidate account to bookmark roles.",
        });
        const next = jobDetailsHref(resolveJobsBasePath(pathname), jobId);
        router.push(`/login/candidate?next=${encodeURIComponent(next)}`);
        return;
      }

      const currentlySaved = idSet.has(jobId);
      // Optimistic update
      setSavedIds((prev) =>
        currentlySaved ? prev.filter((id) => id !== jobId) : [...prev, jobId],
      );

      if (currentlySaved) {
        const result = await candidateSavedJobService.unsaveJob(jobId);
        if (!result.success) {
          setSavedIds((prev) => [...prev, jobId]);
          if (result.code === "UNAUTHENTICATED") {
            toast.error("Your session has expired. Please sign in again to save jobs.");
            router.push("/login/candidate");
            return;
          }
          toast.error(result.error);
          return;
        }
        setSavedJobs((prev) => prev.filter((job) => job.id !== jobId));
        toast.success("Job removed from Saved Jobs.");
        return;
      }

      const result = await candidateSavedJobService.saveJob(jobId);
      if (!result.success) {
        setSavedIds((prev) => prev.filter((id) => id !== jobId));
        if (result.code === "UNAUTHENTICATED") {
          toast.error("Your session has expired. Please sign in again to save jobs.");
          router.push("/login/candidate");
          return;
        }
        toast.error(result.error);
        return;
      }
      toast.success("Job saved successfully.");
      void refreshSaved();
    },
    [idSet, isAuthenticated, pathname, refreshSaved, router],
  );

  const removeSaved = useCallback(
    async (jobId: string) => {
      if (!isAuthenticated) return;
      const previouslySaved = idSet.has(jobId);
      if (!previouslySaved) return;

      setSavedIds((prev) => prev.filter((id) => id !== jobId));
      setSavedJobs((prev) => prev.filter((job) => job.id !== jobId));

      const result = await candidateSavedJobService.unsaveJob(jobId);
      if (!result.success) {
        setSavedIds((prev) => [...prev, jobId]);
        toast.error(result.error);
        void refreshSaved();
        return;
      }
      toast.success("Job removed from Saved Jobs.");
    },
    [idSet, isAuthenticated, refreshSaved],
  );

  const value = useMemo<SavedJobsContextValue>(
    () => ({
      savedIds: idSet,
      savedCount: savedIds.length,
      savedJobs,
      loading,
      isSaved,
      toggleSave,
      removeSaved,
      refreshSaved,
    }),
    [idSet, savedIds.length, savedJobs, loading, isSaved, toggleSave, removeSaved, refreshSaved],
  );

  return (
    <SavedJobsContext.Provider value={value}>{children}</SavedJobsContext.Provider>
  );
}

export function useSavedJobs() {
  const ctx = useContext(SavedJobsContext);
  if (!ctx) {
    throw new Error("useSavedJobs must be used within SavedJobsProvider");
  }
  return ctx;
}
