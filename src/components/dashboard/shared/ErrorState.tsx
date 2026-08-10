import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn’t load this information. Please try again.",
  onRetry,
  action,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  action?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-border bg-card px-6 py-12 text-center shadow-soft"
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-error/10 text-error">
        <AlertCircle size={22} aria-hidden="true" />
      </span>
      <h3 className="text-base font-semibold text-text">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {action ? (
        <div className="mt-5">{action}</div>
      ) : onRetry ? (
        <div className="mt-5">
          <Button type="button" variant="secondary" onClick={onRetry}>
            Try Again
          </Button>
        </div>
      ) : null}
    </div>
  );
}
