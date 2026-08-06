import { hasTheme } from "./theme-registry";
import { migrateLegacyThemeId } from "./theme-labels";
import type { ResolvedThemeMode, ThemeId, ThemeMode } from "./theme-types";
import { DEFAULT_THEME_ID } from "./theme-types";

/** Unified localStorage key for palette + mode. */
export const THEME_SETTINGS_STORAGE_KEY = "gobuild-theme-settings";

/** @deprecated Legacy mode-only key — still read for migration. */
export const THEME_STORAGE_KEY = "gobuild-theme";

/** @deprecated Legacy palette-only key — still read for migration. */
export const THEME_ID_STORAGE_KEY = "gobuild-theme-id";

/** Final fallback when nothing is saved and system preference is unavailable. */
export const DEFAULT_RESOLVED_MODE: ResolvedThemeMode = "light";

/**
 * Persisted theme settings shape.
 * `palette` is the brand theme id; `mode` is the appearance preference.
 */
export interface ThemeSettings {
  palette: ThemeId;
  mode: ThemeMode;
}

export interface ResolveThemeSettingsOptions {
  stored?: ThemeSettings | null;
  systemMode?: ResolvedThemeMode | null;
  defaultPalette?: ThemeId;
  /** Final mode fallback when saved + system are unavailable. Defaults to `"light"`. */
  defaultMode?: ResolvedThemeMode;
  isPaletteRegistered?: (id: ThemeId) => boolean;
}

export interface ResolvedThemeSettings {
  /** Brand palette id to activate. */
  palette: ThemeId;
  /**
   * Preference used by the provider.
   * `"system"` when nothing was saved so OS preference remains the next fallback.
   */
  mode: ThemeMode;
  /** Effective light/dark after applying the fallback chain. */
  resolvedMode: ResolvedThemeMode;
}

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isPersistedThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

function readRaw(key: string): string | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string): void {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode / quota — in-memory state still works.
  }
}

function removeRaw(key: string): void {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

function isThemeSettings(value: unknown): value is ThemeSettings {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ThemeSettings>;
  return (
    typeof candidate.palette === "string" &&
    candidate.palette.trim().length > 0 &&
    isPersistedThemeMode(candidate.mode)
  );
}

/**
 * Resolve brand palette:
 * 1. Saved palette (if registered)
 * 2. Default palette
 */
export function resolvePalettePreference(
  savedPalette: ThemeId | null | undefined,
  defaultPalette: ThemeId = DEFAULT_THEME_ID,
  isPaletteRegistered: (id: ThemeId) => boolean = hasTheme,
): ThemeId {
  if (savedPalette) {
    const migrated = migrateLegacyThemeId(savedPalette);
    if (isPaletteRegistered(migrated)) {
      return migrated;
    }
  }

  if (isPaletteRegistered(defaultPalette)) {
    return defaultPalette;
  }

  return DEFAULT_THEME_ID;
}

/**
 * Resolve appearance:
 * 1. Saved preference
 * 2. System preference
 * 3. Default light
 */
export function resolveModePreference(
  savedMode: ThemeMode | null | undefined,
  systemMode: ResolvedThemeMode | null | undefined,
  fallback: ResolvedThemeMode = DEFAULT_RESOLVED_MODE,
): { mode: ThemeMode; resolvedMode: ResolvedThemeMode } {
  const system = systemMode ?? fallback;

  if (savedMode === "light" || savedMode === "dark") {
    return { mode: savedMode, resolvedMode: savedMode };
  }

  if (savedMode === "system") {
    return { mode: "system", resolvedMode: system };
  }

  // Nothing saved → follow system when available, else default light.
  return {
    mode: "system",
    resolvedMode: system,
  };
}

/**
 * Resolve full settings with the public fallback chain.
 */
export function resolveThemeSettings(
  options: ResolveThemeSettingsOptions = {},
): ResolvedThemeSettings {
  const {
    stored = null,
    systemMode = null,
    defaultPalette = DEFAULT_THEME_ID,
    defaultMode = DEFAULT_RESOLVED_MODE,
    isPaletteRegistered = hasTheme,
  } = options;

  const palette = resolvePalettePreference(
    stored?.palette,
    defaultPalette,
    isPaletteRegistered,
  );

  const { mode, resolvedMode } = resolveModePreference(
    stored?.mode,
    systemMode,
    defaultMode,
  );

  return { palette, mode, resolvedMode };
}

/**
 * Read legacy split keys (mode + palette) used by earlier iterations.
 */
function readLegacyThemeSettings(): ThemeSettings | null {
  const legacyMode = readRaw(THEME_STORAGE_KEY);
  const legacyPalette = readRaw(THEME_ID_STORAGE_KEY);

  const mode = isPersistedThemeMode(legacyMode) ? legacyMode : null;
  const palette =
    legacyPalette && legacyPalette.trim() ? legacyPalette.trim() : null;

  if (!mode && !palette) {
    return null;
  }

  return {
    palette: migrateLegacyThemeId(palette ?? DEFAULT_THEME_ID),
    mode: mode ?? "system",
  };
}

/**
 * Load persisted palette + mode from localStorage.
 * Migrates legacy split keys into the unified settings blob when found.
 */
export function loadThemeSettings(
  storageKey: string = THEME_SETTINGS_STORAGE_KEY,
): ThemeSettings | null {
  const raw = readRaw(storageKey);

  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isThemeSettings(parsed)) {
        return {
          ...parsed,
          palette: migrateLegacyThemeId(parsed.palette),
        };
      }
    } catch {
      // Fall through to legacy / null
    }
  }

  const legacy = readLegacyThemeSettings();
  if (legacy) {
    saveThemeSettings(legacy, storageKey);
    return legacy;
  }

  return null;
}

/**
 * Persist palette + mode together. Reusable from provider or non-React code.
 */
export function saveThemeSettings(
  settings: ThemeSettings,
  storageKey: string = THEME_SETTINGS_STORAGE_KEY,
): void {
  if (!isThemeSettings(settings)) {
    throw new Error("saveThemeSettings: invalid settings payload");
  }

  writeRaw(storageKey, JSON.stringify(settings));

  // Keep legacy keys in sync for any older readers.
  writeRaw(THEME_STORAGE_KEY, settings.mode);
  writeRaw(THEME_ID_STORAGE_KEY, settings.palette);
}

/**
 * Clear unified + legacy theme settings keys.
 */
export function clearThemeSettings(
  storageKey: string = THEME_SETTINGS_STORAGE_KEY,
): void {
  removeRaw(storageKey);
  removeRaw(THEME_STORAGE_KEY);
  removeRaw(THEME_ID_STORAGE_KEY);
}

/** @deprecated Prefer {@link loadThemeSettings}. */
export function getStoredThemeMode(
  storageKey: string = THEME_STORAGE_KEY,
): ThemeMode | null {
  if (storageKey === THEME_STORAGE_KEY) {
    return loadThemeSettings()?.mode ?? null;
  }

  const value = readRaw(storageKey);
  return isPersistedThemeMode(value) ? value : null;
}

/** @deprecated Prefer {@link saveThemeSettings}. */
export function setStoredThemeMode(
  mode: ThemeMode,
  storageKey: string = THEME_STORAGE_KEY,
): void {
  if (storageKey !== THEME_STORAGE_KEY) {
    writeRaw(storageKey, mode);
    return;
  }

  const current = loadThemeSettings();
  saveThemeSettings({
    palette: current?.palette ?? DEFAULT_THEME_ID,
    mode,
  });
}

/** @deprecated Prefer {@link clearThemeSettings}. */
export function clearStoredThemeMode(
  storageKey: string = THEME_STORAGE_KEY,
): void {
  if (storageKey === THEME_STORAGE_KEY) {
    clearThemeSettings();
    return;
  }
  removeRaw(storageKey);
}

/** @deprecated Prefer {@link loadThemeSettings}. */
export function getStoredThemeId(
  storageKey: string = THEME_ID_STORAGE_KEY,
): ThemeId | null {
  if (storageKey === THEME_ID_STORAGE_KEY) {
    return loadThemeSettings()?.palette ?? null;
  }

  const value = readRaw(storageKey);
  return value && value.trim() ? value : null;
}

/** @deprecated Prefer {@link saveThemeSettings}. */
export function setStoredThemeId(
  themeId: ThemeId,
  storageKey: string = THEME_ID_STORAGE_KEY,
): void {
  if (storageKey !== THEME_ID_STORAGE_KEY) {
    writeRaw(storageKey, themeId);
    return;
  }

  const current = loadThemeSettings();
  saveThemeSettings({
    palette: themeId,
    mode: current?.mode ?? "system",
  });
}

/** @deprecated Prefer {@link clearThemeSettings}. */
export function clearStoredThemeId(
  storageKey: string = THEME_ID_STORAGE_KEY,
): void {
  if (storageKey === THEME_ID_STORAGE_KEY) {
    clearThemeSettings();
    return;
  }
  removeRaw(storageKey);
}
