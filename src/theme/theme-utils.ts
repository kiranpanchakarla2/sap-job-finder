import "./themes";

import { combineThemeById } from "./theme-combine";
import { THEME_MODE_OPTIONS } from "./theme-system";
import type {
  ResolvedThemeMode,
  ThemeId,
  ThemeMode,
  ThemeTokens,
} from "./theme-types";
import { DEFAULT_THEME_ID } from "./theme-types";

/**
 * Type guard for persisted / untrusted theme mode values.
 */
export function isThemeMode(value: unknown): value is ThemeMode {
  return (
    typeof value === "string" &&
    (THEME_MODE_OPTIONS as readonly string[]).includes(value)
  );
}

/**
 * Builds tokens via the combination engine: palette + mode → final theme.
 */
export function getThemeTokens(
  resolvedMode: ResolvedThemeMode,
  themeId: ThemeId = DEFAULT_THEME_ID,
): ThemeTokens {
  return combineThemeById(themeId, resolvedMode).tokens;
}

/**
 * Returns the opposite of the current resolved mode.
 * Used by `toggleMode` so `"system"` exits into an explicit preference.
 */
export function getToggledThemeMode(
  resolvedMode: ResolvedThemeMode,
): ResolvedThemeMode {
  return resolvedMode === "light" ? "dark" : "light";
}

// Re-export system helpers so existing `@/theme` imports keep working.
export {
  getSystemThemeMode,
  isSystemThemeMode,
  resolveThemeMode,
  subscribeToSystemColorScheme,
} from "./theme-system";
export { useSystemThemeMode } from "./use-system-theme-mode";
