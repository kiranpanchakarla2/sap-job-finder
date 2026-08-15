/**
 * Canonical URL and redirect origin resolution for Supabase authentication.
 */

export function getAppOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    const formatted = siteUrl.startsWith("http://") || siteUrl.startsWith("https://")
      ? siteUrl
      : `https://${siteUrl}`;
    return formatted.replace(/\/+$/, "");
  }

  const vercelUrl = (
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_URL
  )?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl}`.replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}

/**
 * Generates the full redirect URL for Supabase email confirmation, password resets, and magic links.
 * Example: https://yourdomain.com/auth/callback?next=/employer/login
 */
export function getEmailRedirectTo(next: string = "/"): string {
  const origin = getAppOrigin();
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", next.startsWith("/") ? next : `/${next}`);
  return url.toString();
}
