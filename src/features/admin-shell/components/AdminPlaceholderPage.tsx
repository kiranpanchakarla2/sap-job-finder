import Link from "next/link";
import { ChevronRight, Construction, LucideIcon } from "lucide-react";

type AdminPlaceholderPageProps = {
  title: string;
  category: string;
  description: string;
  sprintMilestone: string;
  icon: LucideIcon;
};

export function AdminPlaceholderPage({
  title,
  category,
  description,
  sprintMilestone,
  icon: Icon,
}: AdminPlaceholderPageProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/admin" className="hover:text-text transition">
          Admin
        </Link>
        <ChevronRight size={12} className="text-muted/60" aria-hidden="true" />
        <span className="text-muted/80">{category}</span>
        <ChevronRight size={12} className="text-muted/60" aria-hidden="true" />
        <span className="font-medium text-text">{title}</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Icon size={22} aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-text sm:text-2xl">
                {title}
              </h1>
              <span className="rounded-full bg-surface border border-border px-2.5 py-0.5 text-xs font-semibold text-primary">
                {sprintMilestone}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">{description}</p>
          </div>
        </div>
      </div>

      {/* Foundation Placeholder Container */}
      <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-card p-8 sm:p-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-muted">
          <Construction size={28} className="text-primary/70" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-text">
          {title} Module Placeholder
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          This section is part of the Super Admin routing architecture established in Sprint 10A. Full administrative management capabilities for this module will be activated in {sprintMilestone}.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-medium text-muted">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          Status: Foundation Ready · Implementation Scheduled
        </div>
      </div>
    </div>
  );
}
