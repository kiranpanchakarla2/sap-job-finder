"use client";

import { useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { RemovableTag, SelectableChip } from "./TagChip";

export function TagInputField({
  label,
  values,
  suggestions = [],
  onChange,
  disabled,
  placeholder = "Type and press Enter",
}: {
  label: string;
  values: string[];
  suggestions?: readonly string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState("");

  const addValue = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    const exists = values.some(
      (item) => item.toLowerCase() === value.toLowerCase(),
    );
    if (exists) {
      setDraft("");
      return;
    }
    onChange([...values, value]);
    setDraft("");
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    addValue(draft);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addValue(draft);
    }
    if (event.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  };

  const availableSuggestions = suggestions.filter(
    (item) =>
      !values.some((value) => value.toLowerCase() === item.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <label htmlFor={id} className="block text-sm font-medium text-text">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <RemovableTag
            key={value}
            label={value}
            disabled={disabled}
            onRemove={() => onChange(values.filter((item) => item !== value))}
          />
        ))}
      </div>
      {!disabled ? (
        <>
          <form onSubmit={onSubmit} className="flex gap-2">
            <input
              id={id}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-input px-3 text-sm text-input-fg outline-none transition focus:border-primary focus:shadow-[0_0_0_4px_rgba(79,70,229,0.12)]"
            />
            <button
              type="submit"
              className="h-11 shrink-0 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-text transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              Add
            </button>
          </form>
          {availableSuggestions.length ? (
            <div className="flex flex-wrap gap-2">
              {availableSuggestions.slice(0, 8).map((item) => (
                <SelectableChip
                  key={item}
                  label={item}
                  selected={false}
                  onToggle={() => addValue(item)}
                />
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
