"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ActiveFilterChip } from "../types/talentSearch.types";

export function ActiveFilterChips({
  chips,
  onRemove,
  onClearAll,
}: {
  chips: ActiveFilterChip[];
  onRemove: (chip: ActiveFilterChip) => void;
  onClearAll: () => void;
}) {
  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => onRemove(chip)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          aria-label={`Remove filter ${chip.label}`}
        >
          {chip.label}
          <X size={12} aria-hidden="true" />
        </button>
      ))}
      <Button
        type="button"
        variant="ghost"
        className="!px-2 !py-1 text-xs"
        onClick={onClearAll}
      >
        Clear All
      </Button>
    </div>
  );
}
