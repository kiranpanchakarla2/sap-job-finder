"use client";

import { useCallback, useEffect, useState } from "react";
import { employerProfileService } from "../services/employerProfileService";
import type {
  EmployerPersonalProfile,
  EmployerPersonalProfileUpdate,
} from "../types/profile.types";

type LoadState = "idle" | "loading" | "success" | "error";

export function useEmployerPersonalProfile() {
  const [profile, setProfile] = useState<EmployerPersonalProfile | null>(null);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    const result = await employerProfileService.getMyProfile();
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

  const save = useCallback(
    async (input: EmployerPersonalProfileUpdate) => {
      setSaving(true);
      const result = await employerProfileService.updateMyProfile(input);
      setSaving(false);
      if (!result.success) {
        return result;
      }
      setProfile(result.data);
      return result;
    },
    [],
  );

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
