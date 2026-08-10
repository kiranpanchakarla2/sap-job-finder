"use client";

import { useCallback, useEffect, useState } from "react";
import { useEmployerAuth } from "@/features/employer-auth";
import { companyService } from "../services/companyService";
import type { CompanyProfile, CompanyProfileUpdateInput } from "../types/company.types";

type LoadState = "idle" | "loading" | "success" | "error";

export function useCompanyProfile() {
  const { employer, isLoading: authLoading } = useEmployerAuth();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!employer?.id) {
      setProfile(null);
      setStatus("idle");
      return;
    }

    setStatus("loading");
    setError(null);
    const result = await companyService.getCompanyProfile(employer.id);
    if (!result.success) {
      setError(result.error);
      setStatus("error");
      setProfile(null);
      return;
    }
    setProfile(result.data);
    setStatus("success");
  }, [employer?.id]);

  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [authLoading, load]);

  const save = useCallback(
    async (input: CompanyProfileUpdateInput) => {
      if (!employer?.id) {
        return { success: false as const, error: "Not authenticated." };
      }
      setSaving(true);
      const result = await companyService.updateCompanyProfile(employer.id, input);
      setSaving(false);
      if (result.success) {
        setProfile(result.data);
        setStatus("success");
      }
      return result;
    },
    [employer?.id],
  );

  return {
    profile,
    isLoading: authLoading || status === "loading" || status === "idle",
    isError: status === "error",
    error,
    saving,
    setupComplete: Boolean(profile?.setupComplete),
    hasProfile: Boolean(profile?.setupComplete),
    reload: load,
    save,
  };
}
