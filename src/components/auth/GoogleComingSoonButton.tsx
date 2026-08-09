"use client";

import { toast } from "sonner";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M9 7.2v3.5h4.9c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.3-.2-1.9H9z"
      />
      <path
        fill="#34A853"
        d="M4 10.7l-.6.5-2.1 1.6C2.6 15.5 5.5 17.5 9 17.5c2.4 0 4.4-.8 5.9-2.1l-3.1-2.4c-.8.6-1.9.9-2.8.9-2.2 0-4-1.5-4.7-3.5z"
      />
      <path
        fill="#4A90E2"
        d="M1.3 5.3C.5 6.8 0 8.3 0 10s.5 3.2 1.3 4.7l2.7-2.1C3.7 11.7 3.5 10.9 3.5 10s.2-1.7.5-2.5z"
      />
      <path
        fill="#FBBC05"
        d="M9 3.5c1.3 0 2.5.5 3.4 1.3l2.6-2.6C13.4.8 11.4 0 9 0 5.5 0 2.6 2 1.3 5.3l2.7 2.1C4.9 5 6.8 3.5 9 3.5z"
      />
    </svg>
  );
}

export function GoogleComingSoonButton() {
  return (
    <button
      type="button"
      onClick={() => toast.message("Google sign-in is coming soon")}
      className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-border bg-white px-4 text-sm font-semibold text-dark shadow-soft transition hover:border-primary/20 hover:shadow-lift focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
      aria-label="Continue with Google (coming soon)"
    >
      <GoogleIcon />
      Continue with Google
      <span className="rounded-md bg-surface px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
        Soon
      </span>
    </button>
  );
}
