"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ResolvedThemeMode, ThemeId } from "@/theme";
import {
  formatThemeCardLabel,
  formatThemeCardTagline,
  getThemeCardCssVars,
  themeCardStyles,
} from "./theme-card.styles";
import { themeTransition } from "./theme-motion";

export type ThemeCardProps = {
  paletteId: ThemeId;
  mode: ResolvedThemeMode;
  selected?: boolean;
  label?: string;
  className?: string;
  tabIndex?: number;
  onSelect?: (paletteId: ThemeId) => void;
};

/**
 * Reusable theme preview card.
 * Styles via {@link themeCardStyles}; colors via semantic CSS vars.
 */
export function ThemeCard({
  paletteId,
  mode,
  selected = false,
  label,
  className = "",
  tabIndex,
  onSelect,
}: ThemeCardProps) {
  const reduceMotion = useReducedMotion();
  const title = label ?? formatThemeCardLabel(paletteId);
  const tagline = formatThemeCardTagline(paletteId);
  const cssVars = getThemeCardCssVars(paletteId, mode);
  const hoverTransition = themeTransition(reduceMotion, "fast");
  const selectionTransition = themeTransition(reduceMotion, "base");

  const select = () => {
    onSelect?.(paletteId);
  };

  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${title} theme palette${selected ? ", selected" : ""}`}
      tabIndex={tabIndex}
      data-selected={selected ? "true" : "false"}
      data-theme-card={paletteId}
      onClick={select}
      style={cssVars}
      className={`${themeCardStyles.root} ${className}`.trim()}
      animate={
        reduceMotion
          ? undefined
          : {
              scale: selected ? 1.01 : 1,
            }
      }
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -2,
              scale: selected ? 1.02 : 1.015,
            }
      }
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      transition={hoverTransition}
    >
      <div className="p-2.5 pb-0 sm:p-3 sm:pb-0" aria-hidden>
        <div className={`${themeCardStyles.preview} ${themeCardStyles.canvas}`}>
          <div className={themeCardStyles.gradient} />

          <div className={themeCardStyles.content}>
            <div className={themeCardStyles.swatchRow}>
              <span
                className={`${themeCardStyles.swatch} ${themeCardStyles.swatchPrimary}`}
              />
              <span
                className={`${themeCardStyles.swatch} ${themeCardStyles.swatchAccent}`}
              />
              <span className={themeCardStyles.borderSample} />
            </div>

            <div className="flex items-center gap-2">
              <span className={themeCardStyles.button}>Button</span>
              <span
                className="inline-flex h-8 flex-1 items-center rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 text-[10px] font-medium text-[color:var(--muted-text)]"
              >
                Surface
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={themeCardStyles.meta}>
        <div className="min-w-0">
          <p className={themeCardStyles.title} aria-hidden>
            {title}
          </p>
          <p className={themeCardStyles.subtitle} aria-hidden>
            {tagline} · {mode}
          </p>
        </div>
        {selected ? (
          <motion.span
            layoutId={reduceMotion ? undefined : "theme-card-selected-dot"}
            className={themeCardStyles.selectedDot}
            aria-hidden
            initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={selectionTransition}
          />
        ) : (
          <span
            className="h-2 w-2 shrink-0 rounded-full border border-[color:var(--border)]"
            aria-hidden
          />
        )}
      </div>
    </motion.button>
  );
}
