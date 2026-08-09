"use client";

import { Loader2 } from "lucide-react";

export function LoadingSpinner({
  label = "Loading…",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-muted ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
