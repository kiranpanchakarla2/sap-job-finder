/**
 * Public barrel for Supabase utilities.
 *
 * Prefer importing from the specific entry when tree-shaking / bundling matters:
 * - `@/lib/supabase/client`  → Client Components
 * - `@/lib/supabase/server`  → Server Components, Actions, Route Handlers
 * - `@/lib/supabase/middleware` → Next.js middleware only
 */
export { createClient as createBrowserClient } from "./client";
export { createClient as createServerClient } from "./server";
export { getSupabaseEnv, tryGetSupabaseEnv } from "./env";
export type { SupabasePublicEnv } from "./env";
export { updateSession } from "./middleware";
