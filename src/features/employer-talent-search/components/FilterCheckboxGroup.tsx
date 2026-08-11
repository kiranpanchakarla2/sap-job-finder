"use client";

import { useId } from "react";

export function FilterCheckboxGroup<T extends string>({
  legend,
  options,
  values,
  onChange,
}: {
  legend: string;
  options: readonly { value: T; label: string }[] | readonly T[];
  values: T[];
  onChange: (next: T[]) => void;
}) {
  const groupId = useId();

  const normalized = options.map((option) =>
    typeof option === "string"
      ? { value: option as T, label: option }
      : option,
  );

  const toggle = (value: T) => {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value));
      return;
    }
    onChange([...values, value]);
  };

  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold uppercase tracking-wide text-muted">
        {legend}
      </legend>
      <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
        {normalized.map((option) => {
          const inputId = `${groupId}-${option.value}`;
          const checked = values.includes(option.value);
          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className="flex cursor-pointer items-start gap-2 rounded-lg px-1 py-1 text-sm text-text hover:bg-surface"
            >
              <input
                id={inputId}
                type="checkbox"
                checked={checked}
                onChange={() => toggle(option.value)}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
