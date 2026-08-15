"use client";

import {
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  Edit2,
  MapPin,
  Pause,
  Play,
  Sparkles,
  Trash2,
  Wallet,
} from "lucide-react";
import type { JobAlert } from "../types/alert.types";

function formatFrequencyLabel(freq: JobAlert["frequency"]): string {
  switch (freq) {
    case "instant":
      return "Instant Alerts";
    case "daily":
      return "Daily Digest";
    case "weekly":
      return "Weekly Summary";
    default:
      return "Daily Digest";
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function JobAlertCard({
  alert,
  onEdit,
  onTogglePause,
  onDelete,
}: {
  alert: JobAlert;
  onEdit: (alert: JobAlert) => void;
  onTogglePause: (id: string) => void;
  onDelete: (alert: JobAlert) => void;
}) {
  const isActive = alert.status === "active";

  const salaryDisplay =
    alert.salaryMin && alert.salaryMax
      ? `₹${alert.salaryMin}–${alert.salaryMax} LPA`
      : alert.salaryMin
        ? `₹${alert.salaryMin}+ LPA`
        : alert.salaryMax
          ? `Up to ₹${alert.salaryMax} LPA`
          : null;

  return (
    <article className="flex h-full flex-col rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft transition duration-[var(--motion-hover-ms,180ms)] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold leading-snug text-text">
              {alert.name}
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isActive ? "bg-emerald-500" : "bg-amber-500"
                }`}
                aria-hidden="true"
              />
              {isActive ? "Active" : "Paused"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-medium text-muted">
              <Clock size={11} aria-hidden="true" />
              {formatFrequencyLabel(alert.frequency)}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
            {alert.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={13} aria-hidden="true" />
                {alert.location}
              </span>
            )}
            {alert.experience && (
              <span className="inline-flex items-center gap-1">
                <Briefcase size={13} aria-hidden="true" />
                {alert.experience}
              </span>
            )}
            {alert.workMode && (
              <span className="inline-flex items-center gap-1">
                <Building2 size={13} aria-hidden="true" />
                {alert.workMode}
              </span>
            )}
            {salaryDisplay && (
              <span className="inline-flex items-center gap-1">
                <Wallet size={13} aria-hidden="true" />
                {salaryDisplay}
              </span>
            )}
            {alert.employmentType && (
              <span className="inline-flex items-center gap-1">
                {alert.employmentType}
              </span>
            )}
          </div>

          {/* Module & Keyword chips */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {alert.sapModules.map((module) => (
              <span
                key={module}
                className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary"
              >
                {module}
              </span>
            ))}
            {alert.keywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full bg-badge px-2.5 py-0.5 text-[11px] font-medium text-badge-fg"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Calendar size={12} aria-hidden="true" />
            Created {formatDate(alert.createdAt)}
          </span>
          {alert.lastMatchedCount != null && alert.lastMatchedCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-primary">
              <Sparkles size={12} aria-hidden="true" />
              {alert.lastMatchedCount} new matches
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onTogglePause(alert.id)}
            className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-button)] border border-border bg-card px-2.5 text-xs font-semibold text-text transition hover:border-primary/30 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            aria-label={isActive ? `Pause ${alert.name} alert` : `Resume ${alert.name} alert`}
          >
            {isActive ? (
              <>
                <Pause size={12} aria-hidden="true" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play size={12} aria-hidden="true" />
                <span>Resume</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => onEdit(alert)}
            className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-button)] border border-border bg-card px-2.5 text-xs font-semibold text-text transition hover:border-primary/30 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            aria-label={`Edit ${alert.name} alert`}
          >
            <Edit2 size={12} aria-hidden="true" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(alert)}
            className="inline-flex h-8 items-center justify-center rounded-[var(--radius-button)] border border-border bg-card px-2 text-xs font-semibold text-muted transition hover:border-error/40 hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            aria-label={`Delete ${alert.name} alert`}
          >
            <Trash2 size={13} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
