/**
 * Application-owned employer session metadata (not Supabase Auth tokens).
 * Supabase owns auth cookies via @supabase/ssr — do not delete those manually.
 */

import { EMPLOYER_PENDING_EMAIL_KEY } from "../constants";

export const EMPLOYER_SESSION_STARTED_AT_KEY = "sjf_employer_session_started_at";
export const EMPLOYER_LAST_ACTIVITY_AT_KEY = "sjf_employer_last_activity_at";
export const EMPLOYER_SESSION_USER_ID_KEY = "sjf_employer_session_user_id";
export const EMPLOYER_JOB_PREVIEW_DRAFT_KEY = "sapjobsfinder-job-preview-draft";

const CHANNEL_NAME = "sjf-employer-session";

export type EmployerSessionBroadcast =
  | { type: "activity"; at: number; userId: string }
  | { type: "ended"; reason: string; userId: string | null };

function canUseDom(): boolean {
  return typeof window !== "undefined";
}

export function readEmployerSessionStartedAt(): number | null {
  if (!canUseDom()) return null;
  const raw = window.localStorage.getItem(EMPLOYER_SESSION_STARTED_AT_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function readEmployerLastActivityAt(): number | null {
  if (!canUseDom()) return null;
  const raw = window.localStorage.getItem(EMPLOYER_LAST_ACTIVITY_AT_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function readEmployerSessionUserId(): string | null {
  if (!canUseDom()) return null;
  return window.localStorage.getItem(EMPLOYER_SESSION_USER_ID_KEY);
}

/** Start or continue absolute session clock for this employer user. */
export function markEmployerSessionStart(userId: string): void {
  if (!canUseDom()) return;
  const now = Date.now();
  const existingUser = readEmployerSessionUserId();
  const started = readEmployerSessionStartedAt();

  if (existingUser !== userId || !started) {
    window.localStorage.setItem(EMPLOYER_SESSION_STARTED_AT_KEY, String(now));
    window.localStorage.setItem(EMPLOYER_SESSION_USER_ID_KEY, userId);
  }
  window.localStorage.setItem(EMPLOYER_LAST_ACTIVITY_AT_KEY, String(now));
}

export function touchEmployerActivity(userId: string, at = Date.now()): void {
  if (!canUseDom()) return;
  window.localStorage.setItem(EMPLOYER_LAST_ACTIVITY_AT_KEY, String(at));
  if (readEmployerSessionUserId() !== userId) {
    window.localStorage.setItem(EMPLOYER_SESSION_USER_ID_KEY, userId);
  }
  if (!readEmployerSessionStartedAt()) {
    window.localStorage.setItem(EMPLOYER_SESSION_STARTED_AT_KEY, String(at));
  }
  broadcastEmployerSession({ type: "activity", at, userId });
}

export function clearEmployerSessionMetadata(): void {
  if (!canUseDom()) return;
  window.localStorage.removeItem(EMPLOYER_SESSION_STARTED_AT_KEY);
  window.localStorage.removeItem(EMPLOYER_LAST_ACTIVITY_AT_KEY);
  window.localStorage.removeItem(EMPLOYER_SESSION_USER_ID_KEY);
}

/**
 * Clear application-owned employer client state.
 * Does NOT delete Supabase auth cookies or unrelated cookies.
 */
export function clearEmployerClientState(): void {
  if (!canUseDom()) return;

  clearEmployerSessionMetadata();

  try {
    window.sessionStorage.removeItem(EMPLOYER_PENDING_EMAIL_KEY);
    window.sessionStorage.removeItem(EMPLOYER_JOB_PREVIEW_DRAFT_KEY);
  } catch {
    // ignore quota / private mode
  }

  // Remove other app-owned session drafts keyed for employer flows
  try {
    const sessionKeys: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (
        key &&
        (key.startsWith("sjf_employer") ||
          key.startsWith("sapjobsfinder-employer") ||
          key === EMPLOYER_JOB_PREVIEW_DRAFT_KEY)
      ) {
        sessionKeys.push(key);
      }
    }
    sessionKeys.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // ignore
  }
}

export function broadcastEmployerSession(message: EmployerSessionBroadcast): void {
  if (!canUseDom()) return;
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(message);
    channel.close();
  } catch {
    // BroadcastChannel unsupported — localStorage events still help same-origin tabs
  }
}

export function subscribeEmployerSessionBroadcast(
  handler: (message: EmployerSessionBroadcast) => void,
): () => void {
  if (!canUseDom()) return () => undefined;

  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event: MessageEvent<EmployerSessionBroadcast>) => {
      if (event.data && typeof event.data === "object" && "type" in event.data) {
        handler(event.data);
      }
    };
  } catch {
    channel = null;
  }

  const onStorage = (event: StorageEvent) => {
    if (
      event.key === EMPLOYER_LAST_ACTIVITY_AT_KEY &&
      event.newValue &&
      Number.isFinite(Number(event.newValue))
    ) {
      const userId = readEmployerSessionUserId() ?? "";
      handler({
        type: "activity",
        at: Number(event.newValue),
        userId,
      });
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener("storage", onStorage);
    channel?.close();
  };
}
