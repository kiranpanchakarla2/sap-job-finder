"use client";

import { useCallback, useEffect, useState } from "react";
import { interviewService } from "../services/interviewService";
import type {
  EmployerInterview,
  InterviewSummaryStats,
  InterviewTabFilter,
  ShortlistedCandidateOption,
} from "../types/interview.types";

type LoadState = "idle" | "loading" | "success" | "error";

export function useInterviews(tab: InterviewTabFilter = "upcoming") {
  const [interviews, setInterviews] = useState<EmployerInterview[]>([]);
  const [stats, setStats] = useState<InterviewSummaryStats>({
    upcoming: 0,
    today: 0,
    completed: 0,
    cancelled: 0,
  });
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setState("loading");
    setError(null);
    const [listResult, statsResult] = await Promise.all([
      interviewService.listInterviews(tab),
      interviewService.getStats(),
    ]);

    if (!listResult.success) {
      setState("error");
      setError(listResult.error);
      return;
    }

    setInterviews(listResult.data);
    if (statsResult.success) {
      setStats(statsResult.data);
    }
    setState("success");
  }, [tab]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    interviews,
    stats,
    isLoading: state === "loading" || state === "idle",
    isError: state === "error",
    error,
    reload,
  };
}

export function useInterview(interviewId: string) {
  const [interview, setInterview] = useState<EmployerInterview | null>(null);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!interviewId) return;
    setState("loading");
    setError(null);
    const result = await interviewService.getInterview(interviewId);
    if (!result.success) {
      setInterview(null);
      setState("error");
      setError(result.error);
      return;
    }
    setInterview(result.data);
    setState("success");
  }, [interviewId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    interview,
    isLoading: state === "loading" || state === "idle",
    isError: state === "error",
    error,
    reload,
  };
}

export function useShortlistedCandidates() {
  const [candidates, setCandidates] = useState<ShortlistedCandidateOption[]>(
    [],
  );
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setState("loading");
    setError(null);
    const result = await interviewService.listShortlistedCandidates();
    if (!result.success) {
      setState("error");
      setError(result.error);
      return;
    }
    setCandidates(result.data);
    setState("success");
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    candidates,
    isLoading: state === "loading" || state === "idle",
    isError: state === "error",
    error,
    reload,
  };
}

export function useApplicationInterview(applicationId: string | null) {
  const [interview, setInterview] = useState<EmployerInterview | null>(null);
  const [allInterviews, setAllInterviews] = useState<EmployerInterview[]>([]);
  const [state, setState] = useState<LoadState>("idle");

  const reload = useCallback(async () => {
    if (!applicationId) {
      setInterview(null);
      setAllInterviews([]);
      setState("success");
      return;
    }
    setState("loading");
    const [nextResult, listResult] = await Promise.all([
      interviewService.getByApplication(applicationId),
      interviewService.listForApplication(applicationId),
    ]);
    if (!nextResult.success) {
      setInterview(null);
      setAllInterviews([]);
      setState("error");
      return;
    }
    setInterview(nextResult.data);
    setAllInterviews(listResult.success ? listResult.data : []);
    setState("success");
  }, [applicationId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    interview,
    allInterviews,
    isLoading: state === "loading" || state === "idle",
    reload,
  };
}
