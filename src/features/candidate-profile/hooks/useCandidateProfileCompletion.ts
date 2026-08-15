"use client";

import { useEffect, useState } from "react";
import { candidateProfileService } from "../services/candidateProfileService";
import type { ProfileCompletionResult } from "../types/profile.types";

/**
 * Lightweight completion % for the candidate dashboard ProgressCard.
 * Uses the same service + calculator as My Profile.
 */
export function useCandidateProfileCompletion() {
  const [percent, setPercent] = useState<number | null>(null);
  const [completion, setCompletion] = useState<ProfileCompletionResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await candidateProfileService.getProfileCompletion();
      if (cancelled) return;
      if (result.success) {
        setCompletion(result.data);
        setPercent(result.data.percent);
      } else {
        setPercent(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    percent: percent ?? 0,
    completion: completion ?? null,
    isLoading: percent === null,
  };
}
