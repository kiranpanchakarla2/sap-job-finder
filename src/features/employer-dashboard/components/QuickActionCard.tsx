import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

export function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-soft transition hover:border-primary/30 hover:shadow-lift focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-text">{title}</span>
          <ArrowUpRight
            size={14}
            className="text-muted transition group-hover:text-primary"
            aria-hidden="true"
          />
        </span>
        <span className="mt-1 block text-xs text-muted">{description}</span>
      </span>
    </Link>
  );
}
