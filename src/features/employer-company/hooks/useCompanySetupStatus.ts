"use client";

import { useCallback, useEffect, useState } from "react";
import { useEmployerAuth } from "@/features/employer-auth";
import { companyService } from "../services/companyService";
import { EMPLOYER_ROUTES } from "../constants";

/**
 * Resolves whether the authenticated employer has completed company setup.
 * Backed by the mock company service (localStorage) for Sprint 2.
 */
export function useCompanySetupStatus() {
  const { employer, isLoading: authLoading, isAuthenticated } = useEmployerAuth();
  const [checking, setChecking] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);

  const refresh = useCallback(async () => {
    if (!employer?.id) {
      setSetupComplete(false);
      setChecking(false);
      return false;
    }
    setChecking(true);
    const complete = await companyService.isSetupComplete(employer.id);
    setSetupComplete(complete);
    setChecking(false);
    return complete;
  }, [employer?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !employer?.id) {
      setSetupComplete(false);
      setChecking(false);
      return;
    }
    void refresh();
  }, [authLoading, isAuthenticated, employer?.id, refresh]);

  const getPostAuthPath = useCallback(
    (preferredNext?: string | null) => {
      if (!setupComplete) return EMPLOYER_ROUTES.onboarding;
      if (
        preferredNext &&
        preferredNext.startsWith("/employer") &&
        !preferredNext.startsWith("//") &&
        !preferredNext.includes("/login")
      ) {
        return preferredNext;
      }
      return EMPLOYER_ROUTES.dashboard;
    },
    [setupComplete],
  );

  return {
    setupComplete,
    isChecking: authLoading || checking,
    refresh,
    getPostAuthPath,
    onboardingPath: EMPLOYER_ROUTES.onboarding,
    dashboardPath: EMPLOYER_ROUTES.dashboard,
  };
}
