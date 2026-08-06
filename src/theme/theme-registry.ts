import type { ThemeBrandColors, ThemeDefinition } from "./theme-types";

const themeRegistry = new Map<string, ThemeDefinition>();
const listeners = new Set<() => void>();

type ThemeTokensCacheClearer = () => void;
let clearTokensCache: ThemeTokensCacheClearer | null = null;

/** Wired from theme-combine to invalidate compose memo on re-register. */
export function setThemeTokensCacheClearer(fn: ThemeTokensCacheClearer): void {
  clearTokensCache = fn;
}

function emitThemeRegistryChange(): void {
  clearTokensCache?.();
  for (const listener of listeners) {
    listener();
  }
}

function isBrandColorsOnly(
  input: ThemeBrandColors | ThemeDefinition,
): input is ThemeBrandColors {
  return "primary" in input && !("colors" in input);
}

/**
 * Normalizes legacy brand-only plugins and full experience definitions.
 */
export function normalizeThemeDefinition(
  input: ThemeBrandColors | ThemeDefinition,
): ThemeDefinition {
  if (isBrandColorsOnly(input)) {
    return { colors: input };
  }
  return input;
}

/**
 * Subscribe to registry changes (new plugins, HMR re-registration).
 * Compatible with `useSyncExternalStore`.
 */
export function subscribeThemeRegistry(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

/**
 * Registers a named theme definition in the global theme registry.
 * Safe to call at module load from a theme plugin file.
 * Re-registering the same `id` replaces the previous definition.
 */
export function registerTheme(
  id: string,
  input: ThemeBrandColors | ThemeDefinition,
): void {
  if (!id.trim()) {
    throw new Error("registerTheme: theme id must be a non-empty string");
  }

  themeRegistry.set(id, normalizeThemeDefinition(input));
  emitThemeRegistryChange();
}

/**
 * Returns the full theme definition (colors + personality).
 * @throws if the theme has not been registered
 */
export function getThemeDefinition(id: string): ThemeDefinition {
  const definition = themeRegistry.get(id);

  if (!definition) {
    const available = listThemeIds().join(", ") || "(none)";
    throw new Error(
      `getThemeDefinition: theme "${id}" is not registered. Available themes: ${available}`,
    );
  }

  return definition;
}

/**
 * Returns registered brand colors by id (backward-compatible).
 * @throws if the theme has not been registered
 */
export function getTheme(id: string): ThemeBrandColors {
  return getThemeDefinition(id).colors;
}

/**
 * Whether a theme id is present in the registry.
 */
export function hasTheme(id: string): boolean {
  return themeRegistry.has(id);
}

/**
 * Sorted list of registered theme ids.
 * Theme Switcher / grids call this to auto-discover plugins.
 */
export function listThemeIds(): string[] {
  return Array.from(themeRegistry.keys()).sort();
}

/**
 * Snapshot for `useSyncExternalStore` (same reference when contents unchanged).
 */
let themeIdsSnapshot: string[] = [];
let themeIdsSnapshotKey = "";

export function getThemeIdsSnapshot(): string[] {
  const next = listThemeIds();
  const key = next.join("\0");
  if (key !== themeIdsSnapshotKey) {
    themeIdsSnapshot = next;
    themeIdsSnapshotKey = key;
  }
  return themeIdsSnapshot;
}

/**
 * Defines and registers a theme in one step.
 */
export function defineTheme(
  id: string,
  input: ThemeBrandColors | ThemeDefinition,
): ThemeDefinition {
  const definition = normalizeThemeDefinition(input);
  registerTheme(id, definition);
  return definition;
}

/**
 * Plugin entry helper — preferred API inside `src/theme/themes/<name>.ts`.
 *
 * @example Brand-only (legacy)
 * ```ts
 * defineThemePlugin("ocean", { primary: "...", ... });
 * ```
 *
 * @example Full experience
 * ```ts
 * defineThemePlugin("btp", {
 *   colors: { ... },
 *   typography: { fontHeading: "var(--font-manrope), ..." },
 *   effects: { atmosphere: "btp", buttonHover: "ripple" },
 * });
 * ```
 */
export function defineThemePlugin(
  id: string,
  input: ThemeBrandColors | ThemeDefinition,
): ThemeDefinition {
  return defineTheme(id, input);
}
