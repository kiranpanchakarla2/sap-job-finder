import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  canAccessPath,
  getHomePathForRole,
  getLoginPathForRole,
  resolveRoleFromClaims,
  type UserRole,
} from "@/lib/auth/roles";
import type { Database } from "@/types/database";

import { tryGetSupabaseEnv } from "./env";

const PROTECTED_PREFIXES = [
  "/candidate",
  "/employer",
  "/dashboard",
  "/profile",
  "/applications",
  "/recruiter",
  "/admin",
] as const;

function matchProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function loginPathForProtectedRoute(pathname: string): string {
  if (pathname.startsWith("/employer") || pathname.startsWith("/recruiter")) {
    return getLoginPathForRole("employer");
  }
  if (pathname.startsWith("/admin")) {
    return getLoginPathForRole("admin");
  }
  return getLoginPathForRole("candidate");
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
}

/**
 * Refreshes the Supabase auth session and guards protected routes.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const env = tryGetSupabaseEnv();
  const isProtected = matchProtectedRoute(request.nextUrl.pathname);

  if (!env) {
    if (isProtected) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = loginPathForProtectedRoute(request.nextUrl.pathname);
      loginUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
  }

  const { url, publishableKey } = env;

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims as Record<string, unknown> | undefined;
  const isAuthenticated = Boolean(claims?.sub);

  if (!isAuthenticated && isProtected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = loginPathForProtectedRoute(request.nextUrl.pathname);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  if (isAuthenticated && isProtected) {
    let role: UserRole = resolveRoleFromClaims(claims);

    // Prefer DB profile role when available
    try {
      const userId = typeof claims?.sub === "string" ? claims.sub : null;
      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();
        if (profile?.role) {
          role = profile.role as UserRole;
        }
      }
    } catch {
      // Fall back to claims-derived role
    }

    if (!canAccessPath(role, request.nextUrl.pathname)) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = getHomePathForRole(role);
      homeUrl.search = "";
      const redirectResponse = NextResponse.redirect(homeUrl);
      copyCookies(supabaseResponse, redirectResponse);
      return redirectResponse;
    }
  }

  return supabaseResponse;
}
