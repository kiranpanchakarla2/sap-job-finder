"use client";

import { useEffect, useState } from "react";
import { candidateProfileService } from "../services/candidateProfileService";

/**
 * Lightweight completion % for the candidate dashboard ProgressCard.
 * Uses the same service + calculator as My Profile.
 */
export function useCandidateProfileCompletion() {
  const [percent, setPercent] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await candidateProfileService.getProfileCompletionPercent();
      if (cancelled) return;
      if (result.success) setPercent(result.data);
      else setPercent(0);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    percent: percent ?? 0,
    isLoading: percent === null,
  };
}
