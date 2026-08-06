import type { ThemeMode, ThemeTokens } from "./theme-types";

/**
 * Flat map of CSS custom property names → values.
 */
export type ThemeCssVariables = Record<`--${string}`, string>;

export interface ApplyThemeCssVariablesOptions {
  target?: HTMLElement | null;
  preference?: ThemeMode;
}

/**
 * Converts active theme tokens into the full semantic CSS variable contract.
 *
 * Components should consume these names only — never raw hex.
 */
export function themeTokensToCssVariables(
  tokens: ThemeTokens,
): ThemeCssVariables {
  const {
    palette,
    derived,
    radius,
    typography,
    glass,
    shadows,
    gradients,
    motion,
    effects,
  } = tokens;

  return {
    /* Core surfaces */
    "--background": palette.background,
    "--surface": palette.surface,
    "--card": palette.card,
    "--glass": derived.glass,

    /* Brand + status */
    "--primary": palette.primary,
    "--secondary": palette.secondary,
    "--accent": palette.accent,
    "--success": palette.success,
    "--warning": palette.warning,
    "--error": palette.error,

    /* Text */
    "--text": palette.text,
    "--muted-text": palette.mutedText,
    "--muted": palette.mutedText,

    /* Chrome */
    "--border": palette.border,
    "--ring": palette.ring,
    "--focus-ring": derived.focusRing,

    /* Shadows */
    "--shadow": shadows.soft,
    "--shadow-soft": shadows.soft,
    "--shadow-lift": shadows.lift,
    "--shadow-glow": shadows.glow,
    "--shadow-button": shadows.button,

    /* Gradients */
    "--gradient": gradients.brand,
    "--gradient-brand": gradients.brand,
    "--gradient-hero": gradients.hero,
    "--gradient-soft": gradients.soft,
    "--gradient-button": gradients.button,

    /* Regions */
    "--navbar": derived.navbar,
    "--navbar-fg": derived.navbarFg,
    "--footer": derived.footer,
    "--footer-fg": derived.footerFg,

    /* Controls */
    "--input": derived.input,
    "--input-fg": derived.inputFg,
    "--input-border": derived.inputBorder,
    "--badge": derived.badge,
    "--badge-fg": derived.badgeFg,
    "--link": derived.link,
    "--button": derived.button,
    "--button-fg": derived.buttonFg,
    "--button-secondary": derived.buttonSecondary,
    "--button-secondary-fg": derived.buttonSecondaryFg,

    /* Radius + type */
    "--radius-card": radius.card,
    "--radius-control": radius.control,
    "--radius-pill": radius.pill,
    "--radius-button": radius.button,
    "--font-sans": typography.fontSans,
    "--font-body": typography.fontBody,
    "--font-heading": typography.fontHeading,
    "--tracking-heading": typography.trackingHeading,
    "--weight-heading": typography.weightHeading,

    /* Glass */
    "--glass-fill": glass.fill,
    "--glass-blur": glass.blur,
    "--glass-saturate": glass.saturate,
    "--glass-border": glass.border,

    /* Motion */
    "--motion-hover-ms": `${motion.hoverMs}ms`,
    "--motion-transition-ms": `${motion.transitionMs}ms`,
    "--motion-ease": motion.easing,
    "--motion-distance": `${motion.moveDistance}px`,
    "--motion-spring-stiffness": String(motion.springStiffness),
    "--motion-spring-damping": String(motion.springDamping),
    "--glow-intensity": String(motion.glowIntensity),

    /* Effects */
    "--scrollbar-thumb": effects.scrollbarThumb,
    "--scrollbar-track": effects.scrollbarTrack,
    "--hero-overlay": effects.heroOverlay,
    "--section-separator": effects.sectionSeparator,
  };
}

/**
 * Writes theme CSS variables + experience data attributes onto a DOM element.
 */
export function applyThemeCssVariables(
  tokens: ThemeTokens,
  options: ApplyThemeCssVariablesOptions = {},
): void {
  const target =
    options.target ??
    (typeof document !== "undefined" ? document.documentElement : null);

  if (!target) {
    return;
  }

  const variables = themeTokensToCssVariables(tokens);

  for (const [name, value] of Object.entries(variables)) {
    target.style.setProperty(name, value);
  }

  target.dataset.theme = tokens.mode;
  target.dataset.palette = tokens.paletteId;
  target.dataset.atmosphere = tokens.effects.atmosphere;
  target.dataset.buttonHover = tokens.effects.buttonHover;
  target.dataset.cardHover = tokens.effects.cardHover;
  target.dataset.particle = tokens.effects.particleEffect;
  target.dataset.ripple = tokens.effects.ripple ? "true" : "false";
  target.dataset.floating = tokens.effects.floating ? "true" : "false";
  target.dataset.glow = tokens.effects.glow ? "true" : "false";
  target.style.colorScheme = tokens.mode;

  if (options.preference) {
    target.dataset.mode = options.preference;
  }
}

/**
 * Removes previously applied theme CSS variables from a target element.
 */
export function clearThemeCssVariables(
  tokens: ThemeTokens,
  target: HTMLElement | null = typeof document !== "undefined"
    ? document.documentElement
    : null,
): void {
  if (!target) {
    return;
  }

  const variables = themeTokensToCssVariables(tokens);

  for (const name of Object.keys(variables)) {
    target.style.removeProperty(name);
  }

  delete target.dataset.theme;
  delete target.dataset.mode;
  delete target.dataset.palette;
  delete target.dataset.atmosphere;
  delete target.dataset.buttonHover;
  delete target.dataset.cardHover;
  delete target.dataset.particle;
  delete target.dataset.ripple;
  delete target.dataset.floating;
  delete target.dataset.glow;
  target.style.removeProperty("color-scheme");
}
