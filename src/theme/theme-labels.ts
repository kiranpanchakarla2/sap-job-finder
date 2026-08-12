import type { ThemeId } from "./theme-types";

export type ThemeLabelMeta = {
  title: string;
  tagline: string;
};

/** User-facing SAP ecosystem theme names (not element names). */
export const THEME_LABELS: Record<ThemeId, ThemeLabelMeta> = {
  btp: {
    title: "BTP Cloud",
    tagline: "Cyan & violet cloud platform",
  },
  s4hana: {
    title: "S/4HANA",
    tagline: "Teal digital core",
  },
  analytics: {
    title: "Analytics Cloud",
    tagline: "Violet insights palette",
  },
  fiori: {
    title: "Fiori UX",
    tagline: "Clean enterprise neutral palette",
  },
};

/**
 * Maps retired theme ids to current palette ids.
 * Includes legacy element names and the removed "default" (SAP Jobs Finder) palette.
 */
export const LEGACY_THEME_ID_MAP: Record<string, ThemeId> = {
  default: "fiori",
  water: "btp",
  earth: "s4hana",
  fire: "analytics",
  air: "fiori",
};

export function migrateLegacyThemeId(id: string): ThemeId {
  return LEGACY_THEME_ID_MAP[id] ?? (id as ThemeId);
}

export function getThemeLabel(paletteId: ThemeId): string {
  return THEME_LABELS[paletteId]?.title ?? paletteId;
}

export function getThemeTagline(paletteId: ThemeId): string {
  return THEME_LABELS[paletteId]?.tagline ?? "SAP career network";
}
