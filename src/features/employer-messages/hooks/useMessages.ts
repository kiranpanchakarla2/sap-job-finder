"use client";

import { useCallback, useEffect, useState } from "react";
import { messageService } from "../services/messageService";
import type { EmployerConversation } from "../types/message.types";

type LoadState = "idle" | "loading" | "success" | "error";

export function useConversations(search: string) {
  const [conversations, setConversations] = useState<EmployerConversation[]>(
    [],
  );
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setState("loading");
    setError(null);
    const result = await messageService.listConversations(search);
    if (!result.success) {
      setState("error");
      setError(result.error);
      return;
    }
    setConversations(result.data);
    setState("success");
  }, [search]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    conversations,
    isLoading: state === "loading" || state === "idle",
    isError: state === "error",
    error,
    reload,
  };
}

export function useUnreadMessageCount(enabled = true) {
  const [count, setCount] = useState(0);

  const reload = useCallback(async () => {
    if (!enabled) {
      setCount(0);
      return;
    }

    const result = await messageService.getUnreadCount();
    if (result.success) {
      setCount(result.data);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }

    void reload();
    const interval = window.setInterval(() => {
      void reload();
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [enabled, reload]);

  return { unreadCount: count, reload };
}
