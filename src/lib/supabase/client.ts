import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

import { getSupabaseEnv } from "./env";

/**
 * Browser / Client Component Supabase client.
 *
 * - Uses the publishable key (safe for the browser when RLS is enabled).
 * - Cookie storage is handled by `@supabase/ssr` (createBrowserClient singleton).
 * - Call from Client Components (`"use client"`) only.
 */
export function createClient() {
  const { url, publishableKey } = getSupabaseEnv();

  return createBrowserClient<Database>(url, publishableKey);
}
