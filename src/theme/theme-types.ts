import type { ReactNode } from "react";

/**
 * Registry key for a named palette (e.g. `"default"`, `"btp"`).
 * Open string so new theme files do not require type updates.
 */
export type ThemeId = string;

/** Built-in theme registered by `themes/default.ts`. */
export const DEFAULT_THEME_ID: ThemeId = "default";

/**
 * User-selectable appearance preference.
 * `"system"` follows the OS color-scheme preference and resolves to light or dark.
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * Effective appearance after resolving `"system"`.
 */
export type ResolvedThemeMode = Exclude<ThemeMode, "system">;

/**
 * Branding + status colors owned by palette files (`themes/*.ts`).
 * Modes never override these.
 */
export interface ThemeBrandColors {
  primary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  /** Focus-ring tint; also seeds `--focus-ring`. */
  ring: string;
}

/**
 * Neutral / chrome colors owned by mode files (`modes/*.ts`).
 */
export interface ThemeNeutralColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  mutedText: string;
  /** Mid-emphasis text between `text` and `mutedText`. */
  secondary: string;
  border: string;
}

/**
 * Merged brand + mode colors (concrete values).
 */
export type ThemePalette = ThemeBrandColors & ThemeNeutralColors;

/**
 * Derived semantic tokens. Prefer CSS `var(--*)` / `color-mix` references
 * so they track base tokens without baking hex into components.
 */
export interface ThemeDerivedTokens {
  glass: string;
  navbar: string;
  navbarFg: string;
  footer: string;
  footerFg: string;
  input: string;
  inputFg: string;
  inputBorder: string;
  badge: string;
  badgeFg: string;
  link: string;
  button: string;
  buttonFg: string;
  buttonSecondary: string;
  buttonSecondaryFg: string;
  focusRing: string;
  gradientBrand: string;
  gradientHero: string;
  gradientSoft: string;
  shadowSoft: string;
  shadowLift: string;
  shadowGlow: string;
  shadowButton: string;
}

/**
 * Corner-radius scale tokens.
 */
export interface ThemeRadius {
  card: string;
  control: string;
  pill: string;
  button: string;
}

/**
 * Typography tokens (font family stacks + heading personality).
 */
export interface ThemeTypography {
  /** Default UI / body stack (also aliased as `--font-sans`). */
  fontSans: string;
  /** Body copy stack. */
  fontBody: string;
  /** Display / heading stack. */
  fontHeading: string;
  /** Optional letter-spacing for headings. */
  trackingHeading: string;
  /** Optional font-weight for headings. */
  weightHeading: string;
}

/**
 * Glass / frosted surface personality.
 */
export interface ThemeGlassTokens {
  fill: string;
  blur: string;
  saturate: string;
  border: string;
}

/**
 * Elevation / glow shadows (can override derived defaults).
 */
export interface ThemeShadowTokens {
  soft: string;
  lift: string;
  glow: string;
  button: string;
}

/**
 * Gradient personality (brand / hero / soft / button fills).
 */
export interface ThemeGradientTokens {
  brand: string;
  hero: string;
  soft: string;
  button: string;
}

/**
 * Motion personality for Framer Motion + CSS transitions.
 * Durations are milliseconds (numbers); easing is a CSS cubic-bezier string.
 */
export interface ThemeMotionTokens {
  hoverMs: number;
  transitionMs: number;
  springStiffness: number;
  springDamping: number;
  glowIntensity: number;
  easing: string;
  moveDistance: number;
}

/**
 * Named hover / decoration effect ids.
 * Components bind to these via CSS (`data-*`) — never branch on theme id.
 */
export type ThemeButtonHoverEffect =
  | "none"
  | "lift"
  | "ripple"
  | "glow"
  | "fade";

export type ThemeCardHoverEffect = "none" | "lift" | "glow" | "soft";

export type ThemeParticleEffect =
  | "none"
  | "dots"
  | "orbs"
  | "rays"
  | "blobs"
  | "circles";

export type ThemeAtmosphereId =
  | "none"
  | "default"
  | "btp"
  | "s4hana"
  | "analytics"
  | "fiori"
  | (string & {});

/**
 * Experience / effect tokens. Drive decorations and interaction chrome.
 */
export interface ThemeEffectsTokens {
  /** Atmosphere decoration preset (CSS + ThemeAtmosphere). */
  atmosphere: ThemeAtmosphereId;
  buttonHover: ThemeButtonHoverEffect;
  cardHover: ThemeCardHoverEffect;
  particleEffect: ThemeParticleEffect;
  /** Whether buttons may show a ripple pseudo-element. */
  ripple: boolean;
  /** Whether atmosphere may use floating shapes. */
  floating: boolean;
  /** Glow enabled for primary actions / cards. */
  glow: boolean;
  /** CSS value for scrollbar thumb. */
  scrollbarThumb: string;
  /** CSS value for scrollbar track. */
  scrollbarTrack: string;
  /** Extra hero wash (optional CSS background-image layers). */
  heroOverlay: string;
  /** Section separator style hint. */
  sectionSeparator: string;
}

/**
 * Full design-token set for the active (resolved) theme.
 * Produced by the combination engine: palette + mode → final theme.
 */
export interface ThemeTokens {
  paletteId: ThemeId;
  mode: ResolvedThemeMode;
  palette: ThemePalette;
  derived: ThemeDerivedTokens;
  radius: ThemeRadius;
  typography: ThemeTypography;
  glass: ThemeGlassTokens;
  shadows: ThemeShadowTokens;
  gradients: ThemeGradientTokens;
  motion: ThemeMotionTokens;
  effects: ThemeEffectsTokens;
}

/**
 * Plugin definition — colors required; personality optional.
 * Creating a new theme = one file with this shape + register import.
 */
export interface ThemeDefinition {
  colors: ThemeBrandColors;
  typography?: Partial<ThemeTypography>;
  radius?: Partial<ThemeRadius>;
  glass?: Partial<ThemeGlassTokens>;
  shadows?: Partial<ThemeShadowTokens>;
  gradients?: Partial<ThemeGradientTokens>;
  motion?: Partial<ThemeMotionTokens>;
  effects?: Partial<ThemeEffectsTokens>;
  /** Partial overrides for derived semantic tokens. */
  derived?: Partial<ThemeDerivedTokens>;
}

/**
 * Result of combining a brand palette with a light/dark mode.
 */
export interface FinalTheme {
  paletteId: ThemeId;
  mode: ResolvedThemeMode;
  colors: ThemePalette;
  tokens: ThemeTokens;
}

/**
 * Public shape exposed by the theme React context via {@link useTheme}.
 */
export interface ThemeContext {
  theme: ThemeId;
  mode: ThemeMode;
  resolvedMode: ResolvedThemeMode;
  systemMode: ResolvedThemeMode;
  tokens: ThemeTokens;
  setTheme: (themeId: ThemeId) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

/**
 * Props for {@link ThemeProvider}.
 */
export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeId;
  defaultMode?: ThemeMode;
  storageKey?: string;
  resolveTokens?: (
    resolvedMode: ResolvedThemeMode,
    themeId: ThemeId,
  ) => ThemeTokens;
}
