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
import type { DiscoveryJob } from "@/features/candidate-jobs/types/job.types";
import {
  APPLICATION_DRAFTS_STORAGE_KEY,
} from "../constants";
import {
  createEmptyDraft,
} from "../lib/applicationUtils";
import { useAuth } from "@/auth/AuthContext";
import { candidateApplicationService } from "../services/candidateApplicationService";
import type {
  ApplicationDraft,
  CandidateApplication,
  SelectableResume,
} from "../types/application.types";

type ApplicationsContextValue = {
  applications: CandidateApplication[];
  drafts: ApplicationDraft[];
  resumes: SelectableResume[];
  hydrated: boolean;
  getApplicationById: (id: string) => CandidateApplication | undefined;
  getApplicationByJobId: (jobId: string) => CandidateApplication | undefined;
  getDraftByJobId: (jobId: string) => ApplicationDraft | undefined;
  saveDraft: (draft: ApplicationDraft) => void;
  deleteDraft: (jobId: string) => void;
  submitApplication: (input: {
    job: DiscoveryJob;
    draft: ApplicationDraft;
  }) => Promise<CandidateApplication>;
  withdrawApplication: (applicationId: string) => Promise<void>;
  applicationCount: number;
};

const ApplicationsContext = createContext<ApplicationsContextValue | null>(null);

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function ApplicationsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isCandidate = Boolean(
    isAuthenticated && user && (user.role === "candidate" || user.role === "admin"),
  );

  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [resumes, setResumes] = useState<SelectableResume[]>([]);
  const [drafts, setDrafts] = useState<ApplicationDraft[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const loadRemoteApplications = useCallback(async () => {
    if (!isCandidate || !user?.id) {
      setApplications([]);
      setResumes([]);
      return { success: true as const, data: [] as CandidateApplication[] };
    }
    const [applicationsResult, resumesResult] = await Promise.all([
      candidateApplicationService.getCandidateApplications(),
      candidateApplicationService.getSelectableResumes(),
    ]);
    if (applicationsResult.success) setApplications(applicationsResult.data);
    else setApplications([]);
    if (resumesResult.success) setResumes(resumesResult.data);
    else setResumes([]);
    return applicationsResult;
  }, [isCandidate, user?.id]);

  useEffect(() => {
    const storedDrafts = readJson<ApplicationDraft[]>(APPLICATION_DRAFTS_STORAGE_KEY, []);
    setDrafts(storedDrafts);
    if (authLoading) return;
    void loadRemoteApplications().finally(() => setHydrated(true));
  }, [authLoading, loadRemoteApplications]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(APPLICATION_DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
    } catch {
      // ignore
    }
  }, [drafts, hydrated]);

  const getApplicationById = useCallback(
    (id: string) => applications.find((app) => app.id === id),
    [applications],
  );

  const getApplicationByJobId = useCallback(
    (jobId: string) => applications.find((app) => app.jobId === jobId),
    [applications],
  );

  const getDraftByJobId = useCallback(
    (jobId: string) => drafts.find((draft) => draft.jobId === jobId),
    [drafts],
  );

  const saveDraft = useCallback((draft: ApplicationDraft) => {
    const next = { ...draft, lastSavedAt: new Date().toISOString() };
    setDrafts((prev) => {
      const others = prev.filter((item) => item.jobId !== draft.jobId);
      return [...others, next];
    });
    toast.success("Application saved as draft.");
  }, []);

  const deleteDraft = useCallback((jobId: string) => {
    setDrafts((prev) => prev.filter((item) => item.jobId !== jobId));
    toast.success("Draft deleted.");
  }, []);

  const submitApplication = useCallback(
    async ({ job, draft }: { job: DiscoveryJob; draft: ApplicationDraft }) => {
      const result = await candidateApplicationService.submit({
        jobId: job.id,
        resumeId: draft.resumeId,
        coverLetter: draft.coverLetter,
        answers: Object.entries(draft.answers).map(([questionId, answer]) => ({ questionId, answer })),
      });
      if (!result.success) throw new Error(result.error);
      const refreshed = await loadRemoteApplications();
      if (!refreshed.success) throw new Error(refreshed.error);
      const application = refreshed.data.find((item) => item.id === result.data);
      if (!application) throw new Error("Application submitted, but could not be loaded.");
      setDrafts((prev) => prev.filter((item) => item.jobId !== job.id));
      toast.success("Application submitted successfully.");
      return application;
    },
    [loadRemoteApplications],
  );

  const withdrawApplication = useCallback(async (applicationId: string) => {
    const result = await candidateApplicationService.withdraw(applicationId);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    await loadRemoteApplications();
    toast.success("Application withdrawn.");
  }, [loadRemoteApplications]);

  const value = useMemo<ApplicationsContextValue>(
    () => ({
      applications,
      drafts,
      resumes,
      hydrated,
      getApplicationById,
      getApplicationByJobId,
      getDraftByJobId,
      saveDraft,
      deleteDraft,
      submitApplication,
      withdrawApplication,
      applicationCount: applications.length,
    }),
    [
      applications,
      resumes,
      drafts,
      hydrated,
      getApplicationById,
      getApplicationByJobId,
      getDraftByJobId,
      saveDraft,
      deleteDraft,
      submitApplication,
      withdrawApplication,
    ],
  );

  return (
    <ApplicationsContext.Provider value={value}>{children}</ApplicationsContext.Provider>
  );
}

export function useApplications() {
  const ctx = useContext(ApplicationsContext);
  if (!ctx) {
    throw new Error("useApplications must be used within ApplicationsProvider");
  }
  return ctx;
}

export { createEmptyDraft } from "../lib/applicationUtils";
