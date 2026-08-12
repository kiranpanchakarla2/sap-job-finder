"use client";

import { useId } from "react";

export function SettingsToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const descriptionId = useId();

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface/40 px-4 py-3">
      <div className="min-w-0">
        <label
          htmlFor={id}
          className={`text-sm font-medium text-text ${disabled ? "opacity-70" : ""}`}
        >
          {label}
        </label>
        {description ? (
          <p id={descriptionId} className="mt-0.5 text-sm text-muted">
            {description}
          </p>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? descriptionId : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${
          checked
            ? "border-primary bg-primary"
            : "border-border bg-surface"
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-card shadow-soft transition ${
            checked ? "left-[1.35rem]" : "left-0.5"
          }`}
          style={{ height: "1.125rem", width: "1.125rem" }}
        />
        <span className="sr-only">{checked ? "On" : "Off"}</span>
      </button>
    </div>
  );
}
