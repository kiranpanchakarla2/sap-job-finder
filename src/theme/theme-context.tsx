"use client";

import { createContext, useContext } from "react";
import type { ThemeContext as ThemeContextValue } from "./theme-types";

/**
 * Internal React context. Prefer {@link useTheme} in app code.
 * Exported so {@link ThemeProvider} can supply the value.
 */
export const ThemeStateContext = createContext<ThemeContextValue | null>(null);

ThemeStateContext.displayName = "ThemeStateContext";

/**
 * Access the active theme state and controls.
 * Must be rendered under {@link ThemeProvider}.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeStateContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
