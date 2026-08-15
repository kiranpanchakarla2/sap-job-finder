import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

export function ProgressCard({
  title,
  description,
  progress,
  href,
  ctaLabel = "Continue",
  className = "",
  breakdown,
}: {
  title: string;
  description?: string;
  progress: number;
  href?: string;
  ctaLabel?: string;
  className?: string;
  breakdown?: Array<{ label: string; complete: boolean }>;
}) {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <div className={`rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-text">{title}</h3>
          {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
        </div>
        <span className="text-sm font-bold text-primary">{clamped}%</span>
      </div>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-surface"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${title} progress`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
          style={{ width: `${clamped}%` }}
        />
      </div>
      
      {breakdown && breakdown.length > 0 ? (
        <div className="mt-5 space-y-2">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">Sections</p>
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
            {breakdown.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {item.complete ? (
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" aria-hidden="true" />
                ) : (
                  <Circle size={14} className="text-muted shrink-0" aria-hidden="true" />
                )}
                <span className={`text-xs ${item.complete ? "text-text" : "text-muted"}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      
      {href ? (
        <Link
          href={href}
          className="mt-4 inline-flex text-sm font-semibold text-primary transition hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 rounded"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
