import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  canAccessPath,
  getHomePathForRole,
  getLoginPathForRole,
  normalizeRole,
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

/** Public employer auth routes — no session required. */
const EMPLOYER_AUTH_PUBLIC_PATHS = [
  "/employer",
  "/employer/login",
  "/employer/register",
  "/employer/forgot-password",
  "/employer/reset-password",
  "/employer/verify-email",
] as const;

/** Public admin auth routes — no session required. */
const ADMIN_AUTH_PUBLIC_PATHS = [
  "/admin/login",
] as const;

function isEmployerAuthPublicPath(pathname: string): boolean {
  if (pathname === "/employer") return true;
  return EMPLOYER_AUTH_PUBLIC_PATHS.filter((path) => path !== "/employer").some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isAdminAuthPublicPath(pathname: string): boolean {
  return ADMIN_AUTH_PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function matchProtectedRoute(pathname: string): boolean {
  if (isEmployerAuthPublicPath(pathname) || isAdminAuthPublicPath(pathname)) {
    return false;
  }
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function loginPathForProtectedRoute(pathname: string): string {
  if (pathname.startsWith("/admin")) {
    return "/admin/login";
  }
  if (pathname.startsWith("/employer") || pathname.startsWith("/recruiter")) {
    return getLoginPathForRole("employer");
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
 * Authorization uses `profiles.role` only — never JWT / user_metadata.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const env = tryGetSupabaseEnv();
  const pathname = request.nextUrl.pathname;
  const isProtected = matchProtectedRoute(pathname);

  if (!env) {
    if (isProtected) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = loginPathForProtectedRoute(pathname);
      loginUrl.searchParams.set("next", pathname);
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
    loginUrl.pathname = loginPathForProtectedRoute(pathname);
    loginUrl.searchParams.set("next", pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  if (isAuthenticated && pathname === "/admin/login") {
    const userId = typeof claims?.sub === "string" ? claims.sub : null;
    if (userId) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();
        const role = normalizeRole(profile?.role);
        if (role === "super_admin" || role === "admin") {
          const adminUrl = request.nextUrl.clone();
          adminUrl.pathname = "/admin";
          adminUrl.search = "";
          const redirectResponse = NextResponse.redirect(adminUrl);
          copyCookies(supabaseResponse, redirectResponse);
          return redirectResponse;
        }
      } catch {
        // Continue to /admin/login if lookup fails
      }
    }
  }

  if (isAuthenticated && isProtected) {
    const userId = typeof claims?.sub === "string" ? claims.sub : null;
    let role: UserRole | null = null;

    if (userId) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();
        role = normalizeRole(profile?.role);
      } catch {
        role = null;
      }
    }

    // Fail closed: session without a DB profile cannot access protected routes.
    if (!role) {
      await supabase.auth.signOut();
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = loginPathForProtectedRoute(pathname);
      loginUrl.searchParams.set("next", pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      copyCookies(supabaseResponse, redirectResponse);
      return redirectResponse;
    }

    if (!canAccessPath(role, pathname)) {
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
