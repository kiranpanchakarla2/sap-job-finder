import {
  DEFAULT_THEME_GRADIENTS,
  DEFAULT_THEME_SHADOWS,
  buildDefaultDerivedTokens,
} from "./theme-defaults";
import type { ThemeDerivedTokens, ThemeDefinition } from "./theme-types";

/**
 * Builds derived semantic tokens, merging optional plugin overrides.
 * Values intentionally reference `var(--*)` / `color-mix` so components
 * never need raw hex.
 */
export function buildDerivedTokens(
  definition?: ThemeDefinition,
  glassFill?: string,
): ThemeDerivedTokens {
  const shadows = {
    ...DEFAULT_THEME_SHADOWS,
    ...definition?.shadows,
  };

  const gradients = {
    ...DEFAULT_THEME_GRADIENTS,
    ...definition?.gradients,
  };

  const fill = glassFill ?? definition?.glass?.fill;
  const base = buildDefaultDerivedTokens(fill, shadows, gradients);

  return {
    ...base,
    ...definition?.derived,
    glass: definition?.derived?.glass ?? fill ?? base.glass,
  };
}
