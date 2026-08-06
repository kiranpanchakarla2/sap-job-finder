import { defineThemePlugin } from "../theme-registry";
import type { ThemeDefinition } from "../theme-types";

/**
 * Fiori UX — SAP Horizon design language.
 * Signature Fiori blue with soft periwinkle accents and frosted glass.
 */
const definition = {
  colors: {
    primary: "#0A6ED1",
    accent: "#A78BFA",
    success: "#059669",
    warning: "#D97706",
    error: "#E11D48",
    ring: "color-mix(in srgb, #0A6ED1 20%, transparent)",
  },
  typography: {
    fontHeading:
      "var(--font-outfit), var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    fontBody: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    fontSans: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    trackingHeading: "-0.04em",
    weightHeading: "600",
  },
  radius: {
    card: "22px",
    control: "14px",
    button: "14px",
  },
  glass: {
    fill: "color-mix(in srgb, var(--card) 52%, transparent)",
    blur: "28px",
    saturate: "1.45",
    border: "color-mix(in srgb, var(--accent) 24%, transparent)",
  },
  shadows: {
    soft: "0 4px 22px color-mix(in srgb, #0A6ED1 6%, transparent)",
    lift: "0 20px 54px color-mix(in srgb, var(--text) 7%, transparent)",
    glow: "0 0 0 1px color-mix(in srgb, #A78BFA 18%, transparent), 0 12px 34px color-mix(in srgb, #0A6ED1 12%, transparent)",
    button: "0 8px 22px color-mix(in srgb, #0A6ED1 22%, transparent)",
  },
  gradients: {
    brand: "linear-gradient(160deg, #0A6ED1 0%, #6366F1 50%, #A78BFA 100%)",
    hero: "radial-gradient(ellipse 82% 58% at 50% -8%, color-mix(in srgb, #A78BFA 14%, transparent), transparent 55%), radial-gradient(ellipse 60% 40% at 90% 30%, color-mix(in srgb, #0A6ED1 10%, transparent), transparent 50%), linear-gradient(180deg, var(--background) 0%, color-mix(in srgb, #EFF6FF 50%, var(--surface)) 100%)",
    soft: "linear-gradient(180deg, var(--background), color-mix(in srgb, #F5F3FF 35%, var(--surface)))",
    button: "linear-gradient(160deg, #0A6ED1, #6366F1)",
  },
  motion: {
    hoverMs: 260,
    transitionMs: 360,
    springStiffness: 240,
    springDamping: 30,
    glowIntensity: 0.18,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    moveDistance: 10,
  },
  effects: {
    atmosphere: "fiori",
    buttonHover: "fade",
    cardHover: "soft",
    particleEffect: "dots",
    ripple: false,
    floating: true,
    glow: false,
    heroOverlay:
      "radial-gradient(ellipse at 50% 0%, color-mix(in srgb, #A78BFA 10%, transparent), transparent 50%)",
    scrollbarThumb: "color-mix(in srgb, #0A6ED1 40%, var(--border))",
  },
  derived: {
    button: "transparent",
    buttonFg: "#ffffff",
    navbar: "color-mix(in srgb, var(--background) 62%, transparent)",
    focusRing: "color-mix(in srgb, #0A6ED1 50%, var(--text))",
  },
} satisfies ThemeDefinition;

export default defineThemePlugin("fiori", definition);
