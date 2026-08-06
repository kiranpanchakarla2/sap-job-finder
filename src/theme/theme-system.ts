import { DEFAULT_RESOLVED_MODE } from "./theme-storage";
import type { ResolvedThemeMode, ThemeMode } from "./theme-types";

/** Media query used to detect the OS appearance preference. */
export const SYSTEM_COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

/**
 * All supported appearance preferences, including System.
 */
export const THEME_MODE_OPTIONS = ["light", "dark", "system"] as const satisfies readonly ThemeMode[];

/**
 * Subscribe to OS `prefers-color-scheme` changes.
 * Compatible with `useSyncExternalStore` and older Safari (`addListener`).
 */
export function subscribeToSystemColorScheme(
  onStoreChange: () => void,
): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }

  const media = window.matchMedia(SYSTEM_COLOR_SCHEME_QUERY);

  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", onStoreChange);
    return () => media.removeEventListener("change", onStoreChange);
  }

  media.addListener(onStoreChange);
  return () => media.removeListener(onStoreChange);
}

/**
 * Reads the current OS color-scheme preference.
 * Falls back to {@link DEFAULT_RESOLVED_MODE} (`"light"`) when unavailable.
 */
export function getSystemThemeMode(): ResolvedThemeMode {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return DEFAULT_RESOLVED_MODE;
  }

  try {
    return window.matchMedia(SYSTEM_COLOR_SCHEME_QUERY).matches
      ? "dark"
      : "light";
  } catch {
    return DEFAULT_RESOLVED_MODE;
  }
}

/**
 * Resolves a user preference into an effective light/dark mode.
 * When `mode` is `"system"`, returns the current OS preference.
 */
export function resolveThemeMode(
  mode: ThemeMode,
  systemMode: ResolvedThemeMode = getSystemThemeMode(),
): ResolvedThemeMode {
  return mode === "system" ? systemMode : mode;
}

/**
 * Whether the active preference should track the OS color scheme.
 */
export function isSystemThemeMode(mode: ThemeMode): boolean {
  return mode === "system";
}
