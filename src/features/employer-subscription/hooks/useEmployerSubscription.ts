"use client";

import { useCallback, useEffect, useState } from "react";
import { subscriptionService } from "../services/subscriptionService";
import type { EmployerSubscription } from "../types/subscription.types";

type LoadState = "idle" | "loading" | "success" | "error";

export function useEmployerSubscription() {
  const [data, setData] = useState<EmployerSubscription | null>(null);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    const result = await subscriptionService.getSubscription();
    if (!result.success) {
      setData(null);
      setError(result.error);
      setStatus("error");
      return;
    }
    setData(result.data);
    setStatus("success");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    data,
    isLoading: status === "loading" || status === "idle",
    isError: status === "error",
    error,
    reload: load,
  };
}
