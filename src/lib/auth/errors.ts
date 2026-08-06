/**
 * Maps Supabase Auth error messages to user-facing copy.
 * Keep messages generic where possible to avoid account enumeration.
 */
export function getAuthErrorMessage(error: { message?: string; code?: string } | null): string {
  if (!error?.message && !error?.code) {
    return "Something went wrong. Please try again.";
  }

  const message = (error.message ?? "").toLowerCase();
  const code = error.code?.toLowerCase() ?? "";

  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials") ||
    message.includes("invalid email or password")
  ) {
    return "Invalid email or password.";
  }

  if (
    code === "email_not_confirmed" ||
    message.includes("email not confirmed")
  ) {
    return "Please verify your email before signing in. Check your inbox for the confirmation link.";
  }

  if (
    code === "user_already_exists" ||
    message.includes("user already registered") ||
    message.includes("already been registered")
  ) {
    return "An account with this email already exists. Try signing in instead.";
  }

  if (message.includes("password") && message.includes("weak")) {
    return "Please choose a stronger password.";
  }

  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "Network error. Check your connection and try again.";
  }

  const verificationMessage = getVerificationLinkErrorMessage(error);
  if (verificationMessage) {
    return verificationMessage;
  }

  return error.message || "Something went wrong. Please try again.";
}

/**
 * Friendly copy for email verification / magic-link failures
 * (expired OTP, reused link, missing code, etc.).
 */
export function getVerificationLinkErrorMessage(
  error: { message?: string; code?: string } | string | null,
): string | null {
  if (!error) return null;

  const message = (typeof error === "string" ? error : error.message ?? "").toLowerCase();
  const code = (typeof error === "string" ? "" : error.code ?? "").toLowerCase();

  if (
    code === "otp_expired" ||
    message.includes("otp_expired") ||
    (message.includes("expired") &&
      (message.includes("link") || message.includes("otp") || message.includes("token")))
  ) {
    return "This verification link has expired. Sign up again or request a new confirmation email.";
  }

  if (
    code === "otp_disabled" ||
    code === "flow_state_expired" ||
    code === "flow_state_not_found" ||
    message.includes("flow state") ||
    message.includes("invalid or has expired")
  ) {
    return "This verification link is no longer valid. Please request a new one.";
  }

  if (code === "access_denied" || message.includes("access_denied")) {
    return "This verification link is invalid or has expired.";
  }

  if (
    code === "invalid_token" ||
    message.includes("invalid token") ||
    message.includes("token has expired") ||
    message.includes("invalid email otp") ||
    message.includes("email link is invalid")
  ) {
    return "This verification link is invalid or has already been used.";
  }

  if (message.includes("pkce") || message.includes("code verifier")) {
    return "This verification link could not be completed in this browser. Open the link on the same device where you signed up.";
  }

  return null;
}
