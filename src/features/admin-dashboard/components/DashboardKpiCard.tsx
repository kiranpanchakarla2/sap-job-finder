"use client";

/**
 * DashboardKpiCard Component
 * Polished enterprise KPI card with skeleton loading and error states.
 */

import { type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle } from "lucide-react";

type DashboardKpiCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColorClass?: string;
  iconBgClass?: string;
  description?: string;
  badge?: {
    text: string;
    variant?: "neutral" | "primary" | "success" | "warning" | "danger";
  };
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  loading?: boolean;
  error?: string | null;
  footer?: ReactNode;
};

export function DashboardKpiCard({
  title,
  value,
  icon: Icon,
  iconColorClass = "text-primary",
  iconBgClass = "bg-primary/10",
  description,
  badge,
  trend,
  loading = false,
  error = null,
  footer,
}: DashboardKpiCardProps) {
  if (loading) {
    return (
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 rounded bg-surface/60" />
          <div className="h-9 w-9 rounded-xl bg-surface/60" />
        </div>
        <div className="mt-3 h-8 w-20 rounded bg-surface/80" />
        <div className="mt-2 h-3 w-36 rounded bg-surface/50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[var(--radius-card)] border border-rose-500/20 bg-rose-500/5 p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">
            {title}
          </span>
          <AlertCircle size={18} className="text-rose-500" />
        </div>
        <div className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-400">
          Unable to load data
        </div>
        <p className="mt-1 text-xs text-muted">Please refresh to try again</p>
      </div>
    );
  }

  const badgeVariantClasses = {
    neutral: "bg-surface text-muted border-border",
    primary: "bg-primary/10 text-primary border-primary/20",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  };

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft transition-all duration-200 hover:border-primary/30 hover:shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            {title}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
              {typeof value === "number" ? value.toLocaleString("en-IN") : value}
            </span>
            {badge && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                  badgeVariantClasses[badge.variant || "neutral"]
                }`}
              >
                {badge.text}
              </span>
            )}
          </div>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBgClass} ${iconColorClass}`}
          aria-hidden="true"
        >
          <Icon size={20} />
        </div>
      </div>

      {(description || trend) && (
        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          {description && <span>{description}</span>}
          {trend && (
            <span
              className={`font-semibold ${
                trend.isPositive ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}

      {footer && <div className="mt-3 border-t border-border pt-3">{footer}</div>}
    </div>
  );
}
