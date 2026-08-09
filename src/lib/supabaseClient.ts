/**
 * Convenience re-export for browser Supabase client.
 * Prefer `@/lib/supabase/client` in new code.
 *
 * Uses NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 * (Next.js equivalent of VITE_SUPABASE_*).
 */
export { createClient as supabaseClient, createClient } from "@/lib/supabase/client";
