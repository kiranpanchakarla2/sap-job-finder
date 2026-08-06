import { defineThemePlugin } from "../theme-registry";
import type { ThemeDefinition } from "../theme-types";

/**
 * Default — SAP Jobs Finder baseline (Horizon blue).
 * Clean enterprise blue with indigo accent and soft atmospheric gradients.
 */
const definition = {
  colors: {
    primary: "#0070F2",
    accent: "#6366F1",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    ring: "color-mix(in srgb, #0070F2 22%, transparent)",
  },
  typography: {
    fontHeading: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    fontBody: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    fontSans: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    trackingHeading: "-0.025em",
    weightHeading: "700",
  },
  radius: {
    card: "16px",
    control: "12px",
    button: "14px",
  },
  glass: {
    fill: "color-mix(in srgb, var(--card) 78%, transparent)",
    blur: "20px",
    saturate: "1.25",
    border: "color-mix(in srgb, var(--primary) 14%, var(--border))",
  },
  shadows: {
    soft: "0 4px 24px color-mix(in srgb, #0070F2 8%, transparent)",
    lift: "0 14px 44px color-mix(in srgb, #6366F1 12%, transparent)",
    glow: "0 0 0 1px color-mix(in srgb, #0070F2 14%, transparent), 0 10px 36px color-mix(in srgb, #6366F1 18%, transparent)",
    button: "0 8px 28px color-mix(in srgb, #0070F2 30%, transparent)",
  },
  gradients: {
    brand: "linear-gradient(135deg, #0070F2 0%, #6366F1 100%)",
    hero: "radial-gradient(ellipse 85% 55% at 12% 0%, color-mix(in srgb, #6366F1 14%, transparent), transparent 55%), radial-gradient(ellipse 70% 48% at 88% 18%, color-mix(in srgb, #0070F2 12%, transparent), transparent 50%), linear-gradient(180deg, var(--background) 0%, color-mix(in srgb, #EEF2FF 45%, var(--surface)) 100%)",
    soft: "linear-gradient(180deg, var(--background), color-mix(in srgb, #EFF6FF 55%, var(--surface)))",
    button: "linear-gradient(135deg, #0070F2 0%, #6366F1 100%)",
  },
  effects: {
    atmosphere: "default",
    buttonHover: "lift",
    cardHover: "lift",
    particleEffect: "none",
    ripple: false,
    floating: false,
    glow: false,
    heroOverlay:
      "radial-gradient(ellipse at 40% 0%, color-mix(in srgb, #6366F1 10%, transparent), transparent 50%)",
    scrollbarThumb: "color-mix(in srgb, #0070F2 38%, var(--border))",
  },
  derived: {
    button: "transparent",
    buttonFg: "#ffffff",
    badge: "color-mix(in srgb, #0070F2 12%, var(--surface))",
    badgeFg: "#0070F2",
  },
} satisfies ThemeDefinition;

export default defineThemePlugin("default", definition);
