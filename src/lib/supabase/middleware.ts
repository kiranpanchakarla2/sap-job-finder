import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  canAccessPath,
  getHomePathForRole,
  getLoginPathForPlatform,
  resolveRoleFromClaims,
  type Platform,
} from "@/lib/auth/roles";
import type { Database } from "@/types/database";

import { tryGetSupabaseEnv } from "./env";

type ProtectedRoute = {
  prefix: string;
  platform: Platform;
};

const PROTECTED_ROUTES: ProtectedRoute[] = [
  { prefix: "/dashboard", platform: "public" },
  { prefix: "/profile", platform: "public" },
  { prefix: "/applications", platform: "public" },
  { prefix: "/recruiter", platform: "public" },
  { prefix: "/admin", platform: "public" },
];

function matchProtectedRoute(pathname: string): ProtectedRoute | undefined {
  return PROTECTED_ROUTES.find(
    (route) => pathname === route.prefix || pathname.startsWith(`${route.prefix}/`),
  );
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
  const protectedRoute = matchProtectedRoute(request.nextUrl.pathname);

  if (!env) {
    if (protectedRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = getLoginPathForPlatform(protectedRoute.platform);
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

  if (!isAuthenticated && protectedRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = getLoginPathForPlatform(protectedRoute.platform);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  if (isAuthenticated && protectedRoute) {
    const role = resolveRoleFromClaims(claims);

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
