/**
 * Supabase public environment variables.
 *
 * These are safe to expose to the browser (NEXT_PUBLIC_*).
 * Never put the service-role / secret key in NEXT_PUBLIC_* variables.
 */
export type SupabasePublicEnv = {
  url: string;
  publishableKey: string;
};

/**
 * Returns public Supabase credentials when configured, otherwise `null`.
 * Use in middleware so the app can boot before secrets are filled in.
 *
 * IMPORTANT: Next.js only inlines `NEXT_PUBLIC_*` with static property access
 * (`process.env.NEXT_PUBLIC_FOO`). Dynamic `process.env[name]` is undefined
 * in the browser bundle.
 */
export function tryGetSupabaseEnv(): SupabasePublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    return null;
  }

  return { url, publishableKey };
}

/**
 * Validates and returns the public Supabase credentials used by all clients.
 * Call this at client-creation time so missing config fails fast with a clear error.
 */
export function getSupabaseEnv(): SupabasePublicEnv {
  const env = tryGetSupabaseEnv();

  if (!env) {
    throw new Error(
      "Missing Supabase environment variables. " +
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY " +
        "in .env.local (local) or your Cloudflare Worker vars/secrets (production).",
    );
  }

  return env;
}
