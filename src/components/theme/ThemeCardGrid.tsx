"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  getThemeIdsSnapshot,
  listThemeIds,
  subscribeThemeRegistry,
  type ResolvedThemeMode,
  type ThemeId,
} from "@/theme";
import { moveRadioSelection, announceThemeChange } from "./theme-a11y";
import { formatThemeCardLabel } from "./theme-card.styles";
import { ThemeCard } from "./ThemeCard";

export type ThemeCardGridProps = {
  mode: ResolvedThemeMode;
  selectedId: ThemeId;
  paletteIds?: ThemeId[];
  className?: string;
  "aria-label"?: string;
  onSelect: (paletteId: ThemeId) => void;
};

/**
 * Renders theme cards as a radiogroup with arrow-key navigation.
 * Automatically includes every registered theme plugin.
 */
export function ThemeCardGrid({
  mode,
  selectedId,
  paletteIds,
  className = "",
  "aria-label": ariaLabel = "Theme palette",
  onSelect,
}: ThemeCardGridProps) {
  const groupRef = useRef<HTMLUListElement>(null);
  const discoveredIds = useSyncExternalStore(
    subscribeThemeRegistry,
    getThemeIdsSnapshot,
    listThemeIds,
  );

  const ids = paletteIds ?? discoveredIds;

  const selectTheme = (paletteId: ThemeId) => {
    onSelect(paletteId);
    announceThemeChange(
      `${formatThemeCardLabel(paletteId)} theme selected.`,
    );
  };

  useEffect(() => {
    const selected = groupRef.current?.querySelector<HTMLElement>(
      `[data-theme-card="${CSS.escape(selectedId)}"]`,
    );
    if (selected && groupRef.current?.contains(document.activeElement)) {
      selected.focus({ preventScroll: true });
    }
  }, [selectedId]);

  return (
    <ul
      ref={groupRef}
      className={`grid grid-cols-1 gap-2.5 sm:grid-cols-2 ${className}`.trim()}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      onKeyDown={(event) => {
        const next = moveRadioSelection(ids, selectedId, event.key);
        if (!next) return;
        event.preventDefault();
        selectTheme(next);
      }}
    >
      {ids.map((paletteId) => (
        <li key={paletteId} role="presentation">
          <ThemeCard
            paletteId={paletteId}
            mode={mode}
            selected={selectedId === paletteId}
            tabIndex={selectedId === paletteId ? 0 : -1}
            onSelect={selectTheme}
          />
        </li>
      ))}
    </ul>
  );
}
