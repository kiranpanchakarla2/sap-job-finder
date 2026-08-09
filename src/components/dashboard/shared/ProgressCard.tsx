import Link from "next/link";

export function ProgressCard({
  title,
  description,
  progress,
  href,
  ctaLabel = "Continue",
}: {
  title: string;
  description?: string;
  progress: number;
  href?: string;
  ctaLabel?: string;
}) {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
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
