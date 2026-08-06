import type { CSSProperties } from "react";
import {
  combineThemeById,
  themeTokensToCssVariables,
  type ResolvedThemeMode,
  type ThemeId,
} from "@/theme";
import { getThemeLabel, getThemeTagline } from "@/theme/theme-labels";

/**
 * Shared Theme Card class tokens.
 * Colors come only from semantic CSS variables — never hardcoded per palette.
 */
export const themeCardStyles = {
  root: [
    "group relative flex w-full flex-col overflow-hidden rounded-[var(--radius-card)]",
    "theme-card theme-card-glass",
    "border border-[color:var(--border)] bg-[color:var(--surface)]",
    "text-left shadow-[var(--shadow-soft)] outline-none",
    "transition-[border-color,box-shadow,transform] duration-[var(--motion-hover-ms,180ms)] ease-out",
    "motion-reduce:transition-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)]",
    "data-[selected=true]:border-[color:var(--primary)]",
    "data-[selected=true]:shadow-[var(--shadow-glow)]",
  ].join(" "),
  preview:
    "relative overflow-hidden rounded-[calc(var(--radius-card)-4px)] border border-[color:var(--border)] transition-[border-color] duration-[var(--motion-hover-ms,180ms)] ease-out motion-reduce:transition-none",
  canvas:
    "bg-[color:var(--background)] p-3 transition-colors duration-[var(--motion-transition-ms,220ms)] ease-out motion-reduce:transition-none sm:p-3.5",
  gradient:
    "absolute inset-x-0 top-0 h-10 bg-[image:var(--gradient-brand)] transition-[opacity,filter] duration-[var(--motion-hover-ms,180ms)] ease-out motion-reduce:transition-none",
  content: "relative z-[1] space-y-3 pt-6",
  swatchRow: "flex items-center gap-2",
  swatch:
    "h-3.5 w-3.5 rounded-full border border-[color:var(--border)] shadow-[var(--shadow-soft)] transition-colors duration-[180ms] ease-out motion-reduce:transition-none",
  swatchPrimary: "bg-[color:var(--primary)]",
  swatchAccent: "bg-[color:var(--accent)]",
  button:
    "inline-flex h-8 items-center justify-center rounded-[var(--radius-button,var(--radius-control))] bg-[color:var(--button)] bg-[image:var(--gradient-button)] px-3 text-[11px] font-semibold tracking-tight text-[color:var(--button-fg)] shadow-[var(--shadow-button)] transition-[box-shadow,filter] duration-[var(--motion-hover-ms,180ms)] ease-out motion-reduce:transition-none",
  meta: "flex items-center justify-between gap-3 px-3.5 py-3",
  title: "truncate text-sm font-semibold tracking-tight text-[color:var(--text)]",
  subtitle: "mt-0.5 truncate text-[11px] text-[color:var(--muted-text)]",
  selectedDot: "h-2 w-2 shrink-0 rounded-full bg-[color:var(--primary)]",
  borderSample:
    "h-8 flex-1 rounded-[var(--radius-control)] border border-[color:var(--border)] bg-[color:var(--card)] transition-[border-color,background-color] duration-[180ms] ease-out motion-reduce:transition-none",
} as const;

/**
 * Builds scoped semantic CSS variables for a palette × mode preview.
 * Applied on the card root so descendants consume tokens, not raw colors.
 */
export function getThemeCardCssVars(
  paletteId: ThemeId,
  mode: ResolvedThemeMode,
): CSSProperties {
  const { tokens } = combineThemeById(paletteId, mode);
  return themeTokensToCssVariables(tokens) as CSSProperties;
}

export function formatThemeCardLabel(paletteId: ThemeId): string {
  return getThemeLabel(paletteId);
}

export function formatThemeCardTagline(paletteId: ThemeId): string {
  return getThemeTagline(paletteId);
}
