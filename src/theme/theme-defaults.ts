import type {
  ThemeDerivedTokens,
  ThemeEffectsTokens,
  ThemeGlassTokens,
  ThemeGradientTokens,
  ThemeMotionTokens,
  ThemeRadius,
  ThemeShadowTokens,
  ThemeTypography,
} from "./theme-types";

export const DEFAULT_THEME_RADIUS: ThemeRadius = {
  card: "16px",
  control: "12px",
  pill: "9999px",
  button: "16px",
};

export const DEFAULT_THEME_TYPOGRAPHY: ThemeTypography = {
  fontSans: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  fontBody: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  fontHeading: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  trackingHeading: "-0.02em",
  weightHeading: "700",
};

export const DEFAULT_THEME_GLASS: ThemeGlassTokens = {
  fill: "color-mix(in srgb, var(--surface) 72%, transparent)",
  blur: "20px",
  saturate: "1.2",
  border: "color-mix(in srgb, var(--border) 80%, transparent)",
};

export const DEFAULT_THEME_SHADOWS: ThemeShadowTokens = {
  soft: "0 4px 24px color-mix(in srgb, var(--text) 6%, transparent)",
  lift: "0 12px 40px color-mix(in srgb, var(--text) 10%, transparent)",
  glow: "0 0 0 1px color-mix(in srgb, var(--primary) 12%, transparent), 0 8px 32px color-mix(in srgb, var(--primary) 20%, transparent)",
  button: "0 8px 24px color-mix(in srgb, var(--primary) 28%, transparent)",
};

export const DEFAULT_THEME_GRADIENTS: ThemeGradientTokens = {
  brand: "linear-gradient(135deg, var(--primary), var(--accent))",
  hero: "radial-gradient(ellipse at top, color-mix(in srgb, var(--primary) 8%, transparent), transparent 55%), radial-gradient(ellipse at bottom right, color-mix(in srgb, var(--accent) 7%, transparent), transparent 45%), linear-gradient(180deg, var(--background) 0%, var(--surface) 100%)",
  soft: "linear-gradient(180deg, var(--background) 0%, var(--surface) 100%)",
  button: "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 70%, var(--accent)))",
};

export const DEFAULT_THEME_MOTION: ThemeMotionTokens = {
  hoverMs: 180,
  transitionMs: 220,
  springStiffness: 380,
  springDamping: 32,
  glowIntensity: 0.35,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  moveDistance: 6,
};

export const DEFAULT_THEME_EFFECTS: ThemeEffectsTokens = {
  atmosphere: "default",
  buttonHover: "lift",
  cardHover: "lift",
  particleEffect: "none",
  ripple: false,
  floating: false,
  glow: false,
  scrollbarThumb: "color-mix(in srgb, var(--primary) 35%, var(--border))",
  scrollbarTrack: "transparent",
  heroOverlay: "none",
  sectionSeparator: "color-mix(in srgb, var(--border) 90%, transparent)",
};

/**
 * Baseline derived tokens. Experience plugins may override individual keys.
 */
export function buildDefaultDerivedTokens(
  glassFill: string = DEFAULT_THEME_GLASS.fill,
  shadows: ThemeShadowTokens = DEFAULT_THEME_SHADOWS,
  gradients: ThemeGradientTokens = DEFAULT_THEME_GRADIENTS,
): ThemeDerivedTokens {
  return {
    glass: glassFill,
    navbar: "color-mix(in srgb, var(--background) 75%, transparent)",
    navbarFg: "var(--text)",
    footer: "var(--surface)",
    footerFg: "var(--text)",
    input: "var(--background)",
    inputFg: "var(--text)",
    inputBorder: "var(--border)",
    badge: "color-mix(in srgb, var(--primary) 14%, var(--surface))",
    badgeFg: "var(--primary)",
    link: "var(--primary)",
    button: "var(--primary)",
    buttonFg: "var(--background)",
    buttonSecondary: "var(--background)",
    buttonSecondaryFg: "var(--text)",
    focusRing: "color-mix(in srgb, var(--primary) 65%, var(--text))",
    gradientBrand: gradients.brand,
    gradientHero: gradients.hero,
    gradientSoft: gradients.soft,
    shadowSoft: shadows.soft,
    shadowLift: shadows.lift,
    shadowGlow: shadows.glow,
    shadowButton: shadows.button,
  };
}
