"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/auth/AuthContext";
import {
  EMPLOYER_ABSOLUTE_SESSION_MS,
  EMPLOYER_ACTIVITY_THROTTLE_MS,
  EMPLOYER_INACTIVITY_TIMEOUT_MS,
  EMPLOYER_INACTIVITY_WARNING_LEAD_MS,
  EMPLOYER_SESSION_TICK_MS,
  type EmployerSessionEndReason,
} from "../config/employerSession";
import { endEmployerSession } from "../lib/endEmployerSession";
import {
  clearEmployerClientState,
  markEmployerSessionStart,
  readEmployerLastActivityAt,
  readEmployerSessionStartedAt,
  subscribeEmployerSessionBroadcast,
  touchEmployerActivity,
} from "../lib/employerSessionStorage";
import { EmployerSessionShell } from "./SessionWarningDialog";

type EmployerSessionContextValue = {
  warningOpen: boolean;
  continueSession: () => Promise<void>;
  endSession: (reason: EmployerSessionEndReason) => Promise<void>;
};

const EmployerSessionContext = createContext<EmployerSessionContextValue | null>(
  null,
);

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "mousedown",
  "keydown",
  "touchstart",
  "pointerdown",
  "scroll",
  "click",
];

/**
 * Single authoritative Employer Portal session timer.
 * Mount only under employer protected layouts — not candidate routes.
 */
export function EmployerSessionProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, refreshSession } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [warningOpen, setWarningOpen] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const endingRef = useRef(false);
  const lastTouchRef = useRef(0);
  const userId = user?.id ?? null;
  const isEmployerUser =
    isAuthenticated &&
    Boolean(user && (user.role === "employer" || user.role === "admin"));

  const endSession = useCallback(
    async (reason: EmployerSessionEndReason) => {
      if (endingRef.current) return;
      endingRef.current = true;
      setWarningOpen(false);
      const redirect = await endEmployerSession({
        reason,
        nextPath: pathname,
      });
      await refreshSession();
      router.replace(redirect);
    },
    [pathname, refreshSession, router],
  );

  const continueSession = useCallback(async () => {
    if (!userId) return;
    setContinuing(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        await endSession("invalid");
        return;
      }
      await refreshSession();
      touchEmployerActivity(userId);
      setWarningOpen(false);
    } finally {
      setContinuing(false);
    }
  }, [endSession, refreshSession, userId]);

  // Initialize absolute + inactivity clocks when employer enters portal
  useEffect(() => {
    if (!isEmployerUser || !userId) return;
    markEmployerSessionStart(userId);
    endingRef.current = false;
  }, [isEmployerUser, userId]);

  // Throttled activity tracking
  useEffect(() => {
    if (!isEmployerUser || !userId) return;

    const onActivity = () => {
      if (warningOpen) return;
      const now = Date.now();
      if (now - lastTouchRef.current < EMPLOYER_ACTIVITY_THROTTLE_MS) return;
      lastTouchRef.current = now;
      touchEmployerActivity(userId, now);
    };

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, onActivity, { passive: true });
    });

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, onActivity);
      });
    };
  }, [isEmployerUser, userId, warningOpen]);

  // Navigation counts as activity (pathname change)
  useEffect(() => {
    if (!isEmployerUser || !userId || warningOpen) return;
    touchEmployerActivity(userId);
  }, [pathname, isEmployerUser, userId, warningOpen]);

  // Multi-tab sync
  useEffect(() => {
    if (!isEmployerUser || !userId) return;

    return subscribeEmployerSessionBroadcast((message) => {
      if (message.type === "ended") {
        if (endingRef.current) return;
        // Another tab already signed out — clear local state and follow redirect.
        endingRef.current = true;
        setWarningOpen(false);
        clearEmployerClientState();
        void refreshSession().finally(() => {
          if (message.reason === "explicit") {
            router.replace("/employer");
            return;
          }
          const reason =
            message.reason === "absolute" ||
            message.reason === "inactivity" ||
            message.reason === "invalid" ||
            message.reason === "suspended"
              ? message.reason
              : "invalid";
          router.replace(
            `/employer/login?reason=${encodeURIComponent(reason)}&next=${encodeURIComponent(pathname)}`,
          );
        });
        return;
      }
      if (message.type === "activity" && message.userId === userId) {
        setWarningOpen(false);
      }
    });
  }, [isEmployerUser, pathname, refreshSession, router, userId]);

  // Periodic enforcement tick
  useEffect(() => {
    if (!isEmployerUser || !userId) return;

    const tick = () => {
      if (endingRef.current) return;

      const startedAt = readEmployerSessionStartedAt();
      const lastActivity = readEmployerLastActivityAt() ?? startedAt;
      const now = Date.now();

      if (startedAt && now - startedAt >= EMPLOYER_ABSOLUTE_SESSION_MS) {
        void endSession("absolute");
        return;
      }

      if (lastActivity) {
        const idleFor = now - lastActivity;
        if (idleFor >= EMPLOYER_INACTIVITY_TIMEOUT_MS) {
          void endSession("inactivity");
          return;
        }
        const warnAfter =
          EMPLOYER_INACTIVITY_TIMEOUT_MS - EMPLOYER_INACTIVITY_WARNING_LEAD_MS;
        if (idleFor >= warnAfter) {
          setWarningOpen(true);
        }
      }
    };

    tick();
    const id = window.setInterval(tick, EMPLOYER_SESSION_TICK_MS);
    return () => window.clearInterval(id);
  }, [endSession, isEmployerUser, userId]);

  // Auth listener cleanup path: when session disappears, stop timers via isEmployerUser

  const value = useMemo<EmployerSessionContextValue>(
    () => ({
      warningOpen,
      continueSession,
      endSession,
    }),
    [warningOpen, continueSession, endSession],
  );

  return (
    <EmployerSessionContext.Provider value={value}>
      <EmployerSessionShell
        warningOpen={warningOpen}
        onContinue={() => void continueSession()}
        onSignOut={() => void endSession("explicit")}
        continuing={continuing}
      >
        {children}
      </EmployerSessionShell>
    </EmployerSessionContext.Provider>
  );
}

export function useEmployerSession() {
  const ctx = useContext(EmployerSessionContext);
  if (!ctx) {
    throw new Error(
      "useEmployerSession must be used within EmployerSessionProvider",
    );
  }
  return ctx;
}
