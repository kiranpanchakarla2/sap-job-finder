/**
 * System appearance preference — follows the OS, not a neutral palette.
 *
 * Light/dark neutrals live in `light.ts` / `dark.ts`.
 * This module documents System as a first-class mode that resolves
 * through `prefers-color-scheme` via {@link resolveThemeMode}.
 */

export {
  SYSTEM_COLOR_SCHEME_QUERY,
  THEME_MODE_OPTIONS,
  getSystemThemeMode,
  isSystemThemeMode,
  resolveThemeMode,
  subscribeToSystemColorScheme,
} from "../theme-system";

export { useSystemThemeMode } from "../use-system-theme-mode";
