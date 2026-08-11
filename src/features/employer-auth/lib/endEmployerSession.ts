import { createClient } from "@/lib/supabase/client";
import {
  EMPLOYER_LOGOUT_LANDING_PATH,
  EMPLOYER_SESSION_MESSAGES,
  employerLoginPathWithReason,
  type EmployerSessionEndReason,
} from "../config/employerSession";
import {
  broadcastEmployerSession,
  clearEmployerClientState,
  readEmployerSessionUserId,
} from "../lib/employerSessionStorage";

export function messageForSessionReason(
  reason: EmployerSessionEndReason,
): string {
  switch (reason) {
    case "inactivity":
      return EMPLOYER_SESSION_MESSAGES.inactivityExpired;
    case "absolute":
      return EMPLOYER_SESSION_MESSAGES.absoluteExpired;
    case "suspended":
      return EMPLOYER_SESSION_MESSAGES.suspended;
    case "explicit":
      return "";
    case "invalid":
    default:
      return EMPLOYER_SESSION_MESSAGES.invalid;
  }
}

/**
 * End employer portal session.
 * Supabase owns auth cookie cleanup via signOut().
 * App clears only application-owned state.
 */
export async function endEmployerSession(options: {
  reason: EmployerSessionEndReason;
  nextPath?: string | null;
}): Promise<string> {
  const userId = readEmployerSessionUserId();
  clearEmployerClientState();
  broadcastEmployerSession({
    type: "ended",
    reason: options.reason,
    userId,
  });

  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    // Still redirect — local state is cleared
  }

  if (options.reason === "explicit") {
    return EMPLOYER_LOGOUT_LANDING_PATH;
  }

  return employerLoginPathWithReason(
    options.reason,
    options.nextPath ?? null,
  );
}
