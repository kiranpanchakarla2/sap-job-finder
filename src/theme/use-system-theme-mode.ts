"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_RESOLVED_MODE } from "./theme-storage";
import {
  getSystemThemeMode,
  subscribeToSystemColorScheme,
} from "./theme-system";
import type { ResolvedThemeMode } from "./theme-types";

function getServerSystemThemeSnapshot(): ResolvedThemeMode {
  return DEFAULT_RESOLVED_MODE;
}

/**
 * Live OS appearance preference. Updates automatically when the user
 * changes their system light/dark setting.
 *
 * Client-only — do not import this module from Server Components.
 */
export function useSystemThemeMode(): ResolvedThemeMode {
  return useSyncExternalStore(
    subscribeToSystemColorScheme,
    getSystemThemeMode,
    getServerSystemThemeSnapshot,
  );
}
