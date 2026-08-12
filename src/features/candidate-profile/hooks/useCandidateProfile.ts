"use client";

import { useCallback, useEffect, useState } from "react";
import { candidateProfileService } from "../services/candidateProfileService";
import type { CandidateProfileForm } from "../types/profile.types";

type LoadState = "idle" | "loading" | "success" | "error";

export function useCandidateProfile() {
  const [profile, setProfile] = useState<CandidateProfileForm | null>(null);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    const result = await candidateProfileService.getMyProfile();
    if (!result.success) {
      setProfile(null);
      setError(result.error);
      setStatus("error");
      return;
    }
    setProfile(result.data);
    setStatus("success");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async (form: CandidateProfileForm) => {
    setSaving(true);
    const result = await candidateProfileService.saveMyProfile(form);
    setSaving(false);
    if (result.success) {
      setProfile(result.data);
    }
    return result;
  }, []);

  return {
    profile,
    isLoading: status === "loading" || status === "idle",
    isError: status === "error",
    error,
    saving,
    reload: () => void load(),
    save,
  };
}
