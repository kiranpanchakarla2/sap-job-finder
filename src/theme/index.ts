/**
 * Public barrel for the theme experience engine.
 *
 * ```ts
 * const { theme, mode, setTheme, setMode, toggleMode, tokens } = useTheme();
 * // tokens.effects / tokens.motion / tokens.typography — personality
 * ```
 *
 * Semantic CSS vars (prefer these in components — no raw hex):
 * background, surface, card, glass, primary, secondary, accent,
 * success, warning, error, text, muted-text, border, shadow*,
 * gradient*, navbar, footer, input, badge, link, button, focus-ring,
 * radius-*, font-heading, font-body, motion-*, glass-*
 */

import "./themes";

export type {
  FinalTheme,
  ResolvedThemeMode,
  ThemeAtmosphereId,
  ThemeBrandColors,
  ThemeButtonHoverEffect,
  ThemeCardHoverEffect,
  ThemeContext,
  ThemeDefinition,
  ThemeDerivedTokens,
  ThemeEffectsTokens,
  ThemeGlassTokens,
  ThemeGradientTokens,
  ThemeId,
  ThemeMode,
  ThemeMotionTokens,
  ThemeNeutralColors,
  ThemePalette,
  ThemeParticleEffect,
  ThemeProviderProps,
  ThemeRadius,
  ThemeShadowTokens,
  ThemeTokens,
  ThemeTypography,
} from "./theme-types";

export { DEFAULT_THEME_ID } from "./theme-types";

export { ThemeStateContext, useTheme } from "./theme-context";
export { ThemeProvider } from "./theme-provider";

export type {
  ResolveThemeSettingsOptions,
  ResolvedThemeSettings,
  ThemeSettings,
} from "./theme-storage";

export {
  DEFAULT_RESOLVED_MODE,
  THEME_ID_STORAGE_KEY,
  THEME_SETTINGS_STORAGE_KEY,
  THEME_STORAGE_KEY,
  clearStoredThemeId,
  clearStoredThemeMode,
  clearThemeSettings,
  getStoredThemeId,
  getStoredThemeMode,
  loadThemeSettings,
  resolveModePreference,
  resolvePalettePreference,
  resolveThemeSettings,
  saveThemeSettings,
  setStoredThemeId,
  setStoredThemeMode,
} from "./theme-storage";

export {
  defineTheme,
  defineThemePlugin,
  getTheme,
  getThemeDefinition,
  getThemeIdsSnapshot,
  hasTheme,
  listThemeIds,
  normalizeThemeDefinition,
  registerTheme,
  subscribeThemeRegistry,
} from "./theme-registry";

export {
  applyThemeMode,
  darkNeutrals,
  getModeNeutrals,
  lightNeutrals,
} from "./modes";

export type { CombineThemeOptions } from "./theme-combine";
export {
  DEFAULT_THEME_RADIUS,
  DEFAULT_THEME_TYPOGRAPHY,
  buildThemeTokens,
  clearThemeTokensCache,
  combineTheme,
  combineThemeById,
  getCombinationModeNeutrals,
  listThemeCombinations,
  mergePaletteWithMode,
} from "./theme-combine";

export {
  DEFAULT_THEME_EFFECTS,
  DEFAULT_THEME_GLASS,
  DEFAULT_THEME_GRADIENTS,
  DEFAULT_THEME_MOTION,
  DEFAULT_THEME_SHADOWS,
  buildDefaultDerivedTokens,
} from "./theme-defaults";

export { buildDerivedTokens } from "./theme-semantic";

export {
  SYSTEM_COLOR_SCHEME_QUERY,
  THEME_MODE_OPTIONS,
  getSystemThemeMode,
  isSystemThemeMode,
  resolveThemeMode,
  subscribeToSystemColorScheme,
} from "./theme-system";

export { useSystemThemeMode } from "./use-system-theme-mode";

export {
  applyThemeCssVariables,
  clearThemeCssVariables,
  themeTokensToCssVariables,
} from "./theme-css-vars";
export type {
  ApplyThemeCssVariablesOptions,
  ThemeCssVariables,
} from "./theme-css-vars";

export {
  getThemeTokens,
  getToggledThemeMode,
  isThemeMode,
} from "./theme-utils";

export {
  getThemeLabel,
  getThemeTagline,
  migrateLegacyThemeId,
  THEME_LABELS,
  LEGACY_THEME_ID_MAP,
} from "./theme-labels";
export type { ThemeLabelMeta } from "./theme-labels";
