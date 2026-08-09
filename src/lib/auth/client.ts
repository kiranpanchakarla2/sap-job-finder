import { createClient } from "@/lib/supabase/client";
import {
  getHomePathForRole,
  resolveRoleFromAppMetadata,
  type UserRole,
} from "@/lib/auth/roles";

function getEmailRedirectTo(next = "/dashboard") {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const url = new URL("/auth/callback", origin || "http://localhost:3000");
  url.searchParams.set("next", next);
  return url.toString();
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(input: {
  email: string;
  password: string;
  fullName: string;
}) {
  const supabase = createClient();
  return supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: getEmailRedirectTo("/dashboard"),
      data: {
        full_name: input.fullName,
      },
    },
  });
}

/** Reads the signed-in user's role from server-controlled app_metadata. */
export async function getSignedInRole(): Promise<UserRole | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return resolveRoleFromAppMetadata(
    user.app_metadata as Record<string, unknown> | undefined,
  );
}

/** Post-auth home path for the currently signed-in user. */
export async function getSignedInHomePath(): Promise<string> {
  const role = await getSignedInRole();
  return getHomePathForRole(role ?? "candidate");
}

export async function signOutClient() {
  const supabase = createClient();
  return supabase.auth.signOut();
}
