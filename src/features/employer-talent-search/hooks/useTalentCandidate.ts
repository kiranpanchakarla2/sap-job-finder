"use client";

import { useCallback, useEffect, useState } from "react";
import { talentSearchService } from "../services/talentSearchService";
import type { TalentCandidate } from "../types/talentSearch.types";

type LoadState = "idle" | "loading" | "success" | "error";

/**
 * Loads a single employer-safe Talent Search candidate via RPC.
 */
export function useTalentCandidate(candidateId: string) {
  const [candidate, setCandidate] = useState<TalentCandidate | null>(null);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    setCode(null);
    const result = await talentSearchService.getCandidate(candidateId);
    if (!result.success) {
      setCandidate(null);
      setError(result.error);
      setCode(result.code ?? null);
      setStatus("error");
      return;
    }
    setCandidate(result.data);
    setStatus("success");
  }, [candidateId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    candidate,
    isLoading: status === "loading" || status === "idle",
    isError: status === "error",
    error,
    code,
    reload: () => void load(),
  };
}
