"use client";

import { useId, type ReactNode } from "react";

export function SettingsToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  badge,
  icon,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  badge?: ReactNode;
  icon?: ReactNode;
}) {
  const id = useId();
  const descriptionId = useId();

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border/80 bg-surface/40 p-4 transition-colors hover:border-border">
      <div className="flex items-start gap-3 min-w-0">
        {icon ? (
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-muted">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <label
              htmlFor={id}
              className={`text-sm font-semibold text-text cursor-pointer ${
                disabled ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {label}
            </label>
            {badge ? <div>{badge}</div> : null}
          </div>
          {description ? (
            <p id={descriptionId} className="mt-0.5 text-xs text-muted leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? descriptionId : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${
          checked
            ? "border-primary bg-primary"
            : "border-border bg-surface"
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 block rounded-full bg-white shadow-soft transition-transform ${
            checked ? "translate-x-5.5" : "translate-x-0.5"
          }`}
          style={{ height: "1.125rem", width: "1.125rem" }}
        />
        <span className="sr-only">{checked ? "Enabled" : "Disabled"}</span>
      </button>
    </div>
  );
}
