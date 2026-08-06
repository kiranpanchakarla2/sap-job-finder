"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import "./themes";
import { applyThemeCssVariables } from "./theme-css-vars";
import { ThemeStateContext } from "./theme-context";
import { hasTheme, listThemeIds } from "./theme-registry";
import {
  DEFAULT_RESOLVED_MODE,
  THEME_SETTINGS_STORAGE_KEY,
  loadThemeSettings,
  resolveThemeSettings,
  saveThemeSettings,
} from "./theme-storage";
import {
  getSystemThemeMode,
  resolveThemeMode,
} from "./theme-system";
import { useSystemThemeMode } from "./use-system-theme-mode";
import type {
  ThemeContext,
  ThemeId,
  ThemeMode,
  ThemeProviderProps,
} from "./theme-types";
import { DEFAULT_THEME_ID } from "./theme-types";
import { getThemeTokens, getToggledThemeMode } from "./theme-utils";

/**
 * App-level theme provider.
 *
 * Supports `light` | `dark` | `system`.
 * When mode is `"system"`, watches `prefers-color-scheme` and updates
 * resolved tokens / CSS variables automatically.
 */
export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME_ID,
  defaultMode = "system",
  storageKey = THEME_SETTINGS_STORAGE_KEY,
  resolveTokens = getThemeTokens,
}: ThemeProviderProps) {
  // SSR-safe defaults; real preferences hydrate after mount.
  const [theme, setThemeState] = useState<ThemeId>(defaultTheme);
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);

  // Live OS preference — only affects output while mode === "system".
  const systemMode = useSystemThemeMode();

  // Restore palette + mode on mount / storage key change.
  useEffect(() => {
    const stored = loadThemeSettings(storageKey);
    const resolved = resolveThemeSettings({
      stored,
      systemMode: getSystemThemeMode(),
      defaultPalette: defaultTheme,
      defaultMode: DEFAULT_RESOLVED_MODE,
    });

    setThemeState(resolved.palette);
    setModeState(stored?.mode ? resolved.mode : defaultMode);
  }, [defaultMode, defaultTheme, storageKey]);

  // When preference is "system", this tracks OS changes automatically.
  const resolvedMode = useMemo(
    () => resolveThemeMode(mode, systemMode),
    [mode, systemMode],
  );

  const tokens = useMemo(
    () => resolveTokens(resolvedMode, theme),
    [resolveTokens, resolvedMode, theme],
  );

  // Sync composed tokens → CSS variables on <html>.
  useEffect(() => {
    applyThemeCssVariables(tokens, { preference: mode });
  }, [mode, tokens]);

  const persist = useCallback(
    (nextPalette: ThemeId, nextMode: ThemeMode) => {
      saveThemeSettings({ palette: nextPalette, mode: nextMode }, storageKey);
    },
    [storageKey],
  );

  const setTheme = useCallback(
    (nextThemeId: ThemeId) => {
      if (!hasTheme(nextThemeId)) {
        const available = listThemeIds().join(", ") || "(none)";
        throw new Error(
          `setTheme: theme "${nextThemeId}" is not registered. Available themes: ${available}`,
        );
      }

      setThemeState(nextThemeId);
      persist(nextThemeId, mode);
    },
    [mode, persist],
  );

  const setMode = useCallback(
    (nextMode: ThemeMode) => {
      setModeState(nextMode);
      persist(theme, nextMode);
    },
    [persist, theme],
  );

  const toggleMode = useCallback(() => {
    setModeState((current) => {
      const resolved = resolveThemeMode(current, getSystemThemeMode());
      const next = getToggledThemeMode(resolved);
      persist(theme, next);
      return next;
    });
  }, [persist, theme]);

  const value = useMemo<ThemeContext>(
    () => ({
      theme,
      mode,
      resolvedMode,
      systemMode,
      tokens,
      setTheme,
      setMode,
      toggleMode,
    }),
    [
      theme,
      mode,
      resolvedMode,
      systemMode,
      tokens,
      setTheme,
      setMode,
      toggleMode,
    ],
  );

  return (
    <ThemeStateContext.Provider value={value}>
      {children}
    </ThemeStateContext.Provider>
  );
}
