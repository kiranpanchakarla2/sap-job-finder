import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";

import { getSupabaseEnv } from "./env";

/**
 * Server Component / Server Action / Route Handler Supabase client.
 *
 * - Must be created per request (never as a module-level singleton).
 * - Reads the auth session from cookies set by the middleware.
 * - `setAll` is wrapped in try/catch because Server Components cannot always
 *   write cookies; middleware is responsible for persisting refreshed tokens.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseEnv();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, _headers) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component where cookies are read-only.
          // Safe to ignore when middleware refreshes the session on each request.
        }
      },
    },
  });
}
