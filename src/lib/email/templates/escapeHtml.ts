/**
 * HTML Sanitization Utility for Email Templates
 * Safely escapes untrusted user inputs to prevent HTML/XSS injection in email clients.
 */

const HTML_ESCAPE_LOOKUP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

const HTML_ESCAPE_REGEX = /[&<>"'/]/g;

/**
 * Escapes characters with special meaning in HTML to their corresponding safe HTML entities.
 * If input is null/undefined, returns an empty string.
 */
export function escapeHtml(input: string | null | undefined): string {
  if (!input) return "";
  return String(input).replace(HTML_ESCAPE_REGEX, (match) => HTML_ESCAPE_LOOKUP[match] || match);
}
