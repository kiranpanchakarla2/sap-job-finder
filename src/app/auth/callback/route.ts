import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  getAuthErrorMessage,
  getVerificationLinkErrorMessage,
} from "@/lib/auth/errors";
import {
  getHomePathForRole,
  resolveRoleFromAppMetadata,
} from "@/lib/auth/roles";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

const DEFAULT_NEXT = "/dashboard";

function safeNextPath(next: string | null): string | null {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return null;
}

function buildRedirectUrl(request: Request, path: string): URL {
  const { origin } = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";

  if (!isLocal && forwardedHost) {
    return new URL(path, `https://${forwardedHost}`);
  }

  return new URL(path, origin);
}

function redirectToError(request: Request, message: string) {
  const url = buildRedirectUrl(request, "/auth/error");
  url.searchParams.set("message", message);
  return NextResponse.redirect(url);
}

/**
 * PKCE / email-verification callback.
 *
 * Handles:
 * - `?code=` from Supabase PKCE email confirmation & OAuth
 * - `?token_hash=&type=` from custom email templates
 * - `?error=` / `?error_description=` when Supabase rejects the link
 *
 * On success, sets the session cookie and redirects to `/dashboard`
 * (or a safe relative `next` path).
 *
 * Configure in Supabase Auth → URL Configuration → Redirect URLs:
 *   http://localhost:3000/auth/callback
 *   https://your-domain.com/auth/callback
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const requestedNext = safeNextPath(searchParams.get("next"));

  const linkError =
    searchParams.get("error_description") ||
    searchParams.get("error") ||
    searchParams.get("error_code");

  if (linkError) {
    const friendly =
      getVerificationLinkErrorMessage(linkError) ??
      getAuthErrorMessage({ message: linkError }) ??
      "This verification link is invalid or has expired.";
    return redirectToError(request, friendly);
  }

  if (!code && !(tokenHash && type)) {
    return redirectToError(
      request,
      "This verification link is invalid or incomplete. Please request a new confirmation email.",
    );
  }

  const { url, publishableKey } = getSupabaseEnv();
  const cookieStore = await cookies();
  // Temporary redirect target; overwritten after session exchange using role when needed.
  const successRedirect = NextResponse.redirect(
    buildRedirectUrl(request, requestedNext ?? DEFAULT_NEXT),
  );

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          successRedirect.cookies.set(name, value, options);
        });

        // Preserve CDN cache headers from @supabase/ssr when present.
        Object.entries(headers ?? {}).forEach(([key, value]) => {
          successRedirect.headers.set(key, value);
        });
      },
    },
  });

  let authError: { message?: string; code?: string } | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authError = error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    authError = error;
  }

  if (!authError) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const role = resolveRoleFromAppMetadata(
      user?.app_metadata as Record<string, unknown> | undefined,
    );
    const destination = requestedNext ?? getHomePathForRole(role);

    const roleAwareRedirect = NextResponse.redirect(
      buildRedirectUrl(request, destination),
    );

    // Preserve cookies written during exchangeCodeForSession / verifyOtp.
    successRedirect.cookies.getAll().forEach((cookie) => {
      roleAwareRedirect.cookies.set(cookie.name, cookie.value);
    });

    return roleAwareRedirect;
  }

  const friendly =
    getVerificationLinkErrorMessage(authError) ??
    getAuthErrorMessage(authError);

  return redirectToError(request, friendly);
}
