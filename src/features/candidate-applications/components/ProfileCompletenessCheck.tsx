"use client";

import Link from "next/link";
import { Check, AlertTriangle } from "lucide-react";
import { getApplicationReadiness } from "../lib/applicationUtils";

export function ProfileCompletenessCheck() {
  const readiness = getApplicationReadiness();

  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text">You&apos;re almost ready to apply</h2>
          <p className="mt-1 text-sm text-muted">
            Profile completeness {readiness.percent}% — {readiness.label}.
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {readiness.percent}%
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {readiness.items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface/50 px-3 py-2.5"
          >
            <span className="inline-flex items-center gap-2 text-sm text-text">
              {item.complete ? (
                <Check size={16} className="text-emerald-600" aria-hidden="true" />
              ) : (
                <AlertTriangle size={16} className="text-amber-600" aria-hidden="true" />
              )}
              {item.label}
            </span>
            {!item.complete ? (
              <Link
                href={item.href}
                className="text-xs font-semibold text-primary hover:text-accent"
              >
                {item.actionLabel}
              </Link>
            ) : (
              <span className="text-xs font-medium text-emerald-700">Complete</span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">
        You can continue applying even if some optional profile details are incomplete.
      </p>
    </section>
  );
}
