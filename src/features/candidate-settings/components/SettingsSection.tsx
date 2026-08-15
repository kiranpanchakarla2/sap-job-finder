"use client";

import type { ReactNode } from "react";

export function SettingsSection({
  id,
  title,
  description,
  badge,
  headerAction,
  children,
  isDanger = false,
}: {
  id: string;
  title: string;
  description?: string;
  badge?: ReactNode;
  headerAction?: ReactNode;
  children: ReactNode;
  isDanger?: boolean;
}) {
  return (
    <section
      id={id}
      tabIndex={-1}
      className={`scroll-mt-24 rounded-[var(--radius-card)] border transition-all ${
        isDanger
          ? "border-error/30 bg-card shadow-soft ring-1 ring-error/10"
          : "border-border bg-card shadow-soft"
      } p-5 sm:p-6`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h2
              className={`text-lg font-bold tracking-tight sm:text-xl ${
                isDanger ? "text-error" : "text-text"
              }`}
            >
              {title}
            </h2>
            {badge ? <div>{badge}</div> : null}
          </div>
          {description ? (
            <p className="mt-1 text-sm text-muted">{description}</p>
          ) : null}
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>

      <div className="mt-6 border-t border-border/60 pt-5">{children}</div>
    </section>
  );
}
