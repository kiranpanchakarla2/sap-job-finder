"use client";

import { Check, Circle, X } from "lucide-react";

export function SelectableChip({
  label,
  selected,
  onToggle,
  disabled,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onToggle}
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${
        selected
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-surface text-text hover:border-primary/30"
      }`}
    >
      {label}
    </button>
  );
}

export function RemovableTag({
  label,
  onRemove,
  disabled,
}: {
  label: string;
  onRemove: () => void;
  disabled?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
      {label}
      {!disabled ? (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-0.5 transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label={`Remove ${label}`}
        >
          <X size={12} aria-hidden="true" />
        </button>
      ) : null}
    </span>
  );
}

export function CompletionCheckItem({
  label,
  complete,
}: {
  label: string;
  complete: boolean;
}) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {complete ? (
        <Check
          size={16}
          className="shrink-0 text-success"
          aria-hidden="true"
        />
      ) : (
        <Circle
          size={16}
          className="shrink-0 text-muted"
          aria-hidden="true"
        />
      )}
      <span className={complete ? "text-text" : "text-muted"}>{label}</span>
      <span className="sr-only">
        {complete ? "Complete" : "Incomplete"}
      </span>
    </li>
  );
}
