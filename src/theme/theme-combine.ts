import { darkNeutrals } from "./modes/dark";
import { lightNeutrals } from "./modes/light";
import {
  DEFAULT_THEME_EFFECTS,
  DEFAULT_THEME_GLASS,
  DEFAULT_THEME_GRADIENTS,
  DEFAULT_THEME_MOTION,
  DEFAULT_THEME_RADIUS,
  DEFAULT_THEME_SHADOWS,
  DEFAULT_THEME_TYPOGRAPHY,
} from "./theme-defaults";
import { buildDerivedTokens } from "./theme-semantic";
import { getThemeDefinition, listThemeIds, setThemeTokensCacheClearer } from "./theme-registry";
import type {
  FinalTheme,
  ResolvedThemeMode,
  ThemeBrandColors,
  ThemeDefinition,
  ThemeId,
  ThemeNeutralColors,
  ThemePalette,
  ThemeRadius,
  ThemeTokens,
  ThemeTypography,
} from "./theme-types";
import { DEFAULT_THEME_ID } from "./theme-types";

export {
  DEFAULT_THEME_RADIUS,
  DEFAULT_THEME_TYPOGRAPHY,
} from "./theme-defaults";

export interface CombineThemeOptions {
  palette: ThemeId | ThemeBrandColors | ThemeDefinition;
  mode: ResolvedThemeMode;
  paletteId?: ThemeId;
}

export function getCombinationModeNeutrals(
  mode: ResolvedThemeMode,
): ThemeNeutralColors {
  return mode === "dark" ? darkNeutrals : lightNeutrals;
}

/**
 * Merges brand palette tokens with mode neutral tokens.
 *
 * Palette: primary, accent, success, warning, error, ring
 * Mode: background, surface, card, text, mutedText, secondary, border
 */
export function mergePaletteWithMode(
  brand: ThemeBrandColors,
  mode: ResolvedThemeMode,
): ThemePalette {
  return {
    ...brand,
    ...getCombinationModeNeutrals(mode),
  };
}

function resolveDefinitionInput(
  palette: ThemeId | ThemeBrandColors | ThemeDefinition,
  fallbackId: ThemeId,
): { paletteId: ThemeId; definition: ThemeDefinition } {
  if (typeof palette === "string") {
    return { paletteId: palette, definition: getThemeDefinition(palette) };
  }

  if ("colors" in palette) {
    return { paletteId: fallbackId, definition: palette };
  }

  return { paletteId: fallbackId, definition: { colors: palette } };
}

const tokensCache = new Map<string, ThemeTokens>();

function cacheKey(paletteId: ThemeId, mode: ResolvedThemeMode): string {
  return `${paletteId}:${mode}`;
}

/**
 * Builds the full experience token set for a palette + mode.
 * Results are memoized per paletteId+mode.
 */
export function buildThemeTokens(
  paletteId: ThemeId,
  mode: ResolvedThemeMode,
  colors: ThemePalette,
  definition: ThemeDefinition = { colors },
): ThemeTokens {
  const key = cacheKey(paletteId, mode);
  const cached = tokensCache.get(key);
  if (cached) {
    return cached;
  }

  const radius: ThemeRadius = {
    ...DEFAULT_THEME_RADIUS,
    ...definition.radius,
  };

  const typography: ThemeTypography = {
    ...DEFAULT_THEME_TYPOGRAPHY,
    ...definition.typography,
  };

  const glass = {
    ...DEFAULT_THEME_GLASS,
    ...definition.glass,
  };

  const shadows = {
    ...DEFAULT_THEME_SHADOWS,
    ...definition.shadows,
  };

  const gradients = {
    ...DEFAULT_THEME_GRADIENTS,
    ...definition.gradients,
  };

  const motion = {
    ...DEFAULT_THEME_MOTION,
    ...definition.motion,
  };

  const effects = {
    ...DEFAULT_THEME_EFFECTS,
    atmosphere:
      definition.effects?.atmosphere ??
      (paletteId as typeof DEFAULT_THEME_EFFECTS.atmosphere),
    ...definition.effects,
  };

  const derived = buildDerivedTokens(definition, glass.fill);

  // Keep derived shadows/gradients aligned with experience tokens
  const tokens: ThemeTokens = {
    paletteId,
    mode,
    palette: colors,
    derived: {
      ...derived,
      glass: glass.fill,
      shadowSoft: shadows.soft,
      shadowLift: shadows.lift,
      shadowGlow: shadows.glow,
      shadowButton: shadows.button,
      gradientBrand: gradients.brand,
      gradientHero: gradients.hero,
      gradientSoft: gradients.soft,
    },
    radius,
    typography,
    glass,
    shadows,
    gradients,
    motion,
    effects,
  };

  tokensCache.set(key, tokens);
  return tokens;
}

/**
 * Clears the compose cache (useful after HMR re-registration).
 */
export function clearThemeTokensCache(): void {
  tokensCache.clear();
}

setThemeTokensCacheClearer(clearThemeTokensCache);

/**
 * Theme Combination Engine: Mode + Palette → Final Theme.
 */
export function combineTheme(options: CombineThemeOptions): FinalTheme {
  const { palette, mode, paletteId: explicitId } = options;
  const { paletteId, definition } = resolveDefinitionInput(
    palette,
    explicitId ?? DEFAULT_THEME_ID,
  );
  const colors = mergePaletteWithMode(definition.colors, mode);

  return {
    paletteId,
    mode,
    colors,
    tokens: buildThemeTokens(paletteId, mode, colors, definition),
  };
}

export function combineThemeById(
  paletteId: ThemeId,
  mode: ResolvedThemeMode,
): FinalTheme {
  return combineTheme({ palette: paletteId, mode });
}

export function listThemeCombinations(): ReadonlyArray<{
  paletteId: ThemeId;
  mode: ResolvedThemeMode;
  label: string;
}> {
  const modes: ResolvedThemeMode[] = ["light", "dark"];

  return listThemeIds().flatMap((paletteId) =>
    modes.map((mode) => ({
      paletteId,
      mode,
      label: `${paletteId} + ${mode}`,
    })),
  );
}
