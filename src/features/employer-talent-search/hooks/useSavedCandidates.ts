"use client";

import { useCallback, useEffect, useState } from "react";
import { talentSearchService } from "../services/talentSearchService";
import type { TalentCandidate } from "../types/talentSearch.types";

type LoadState = "idle" | "loading" | "success" | "error";

/**
 * Loads the authenticated company's saved Talent Search candidates.
 */
export function useSavedCandidates() {
  const [items, setItems] = useState<TalentCandidate[]>([]);
  const [ids, setIds] = useState<string[]>([]);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    const result = await talentSearchService.getSavedCandidates();
    if (!result.success) {
      setItems([]);
      setIds([]);
      setError(result.error);
      setStatus("error");
      return;
    }
    setItems(result.data.items);
    setIds(result.data.ids);
    setStatus("success");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    items,
    ids,
    isLoading: status === "loading" || status === "idle",
    isError: status === "error",
    error,
    reload: () => void load(),
  };
}
