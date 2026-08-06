import { defineThemePlugin } from "../theme-registry";
import type { ThemeDefinition } from "../theme-types";

/**
 * S/4HANA — digital core ERP palette.
 * Modern teal + refined gold accents, warm but crisp enterprise feel.
 */
const definition = {
  colors: {
    primary: "#0D9488",
    accent: "#CA8A04",
    success: "#22C55E",
    warning: "#EAB308",
    error: "#DC2626",
    ring: "color-mix(in srgb, #0D9488 24%, transparent)",
  },
  typography: {
    fontHeading: "var(--font-lora), ui-serif, Georgia, serif",
    fontBody: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    fontSans: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    trackingHeading: "-0.01em",
    weightHeading: "600",
  },
  radius: {
    card: "18px",
    control: "14px",
    button: "16px",
  },
  glass: {
    fill: "color-mix(in srgb, var(--surface) 86%, transparent)",
    blur: "14px",
    saturate: "1.08",
    border: "color-mix(in srgb, #CA8A04 16%, var(--border))",
  },
  shadows: {
    soft: "0 6px 24px color-mix(in srgb, #0D9488 10%, transparent)",
    lift: "0 16px 40px color-mix(in srgb, #CA8A04 14%, transparent)",
    glow: "0 0 0 1px color-mix(in srgb, #0D9488 12%, transparent), 0 12px 32px color-mix(in srgb, #CA8A04 16%, transparent)",
    button: "0 8px 26px color-mix(in srgb, #0D9488 28%, transparent)",
  },
  gradients: {
    brand: "linear-gradient(145deg, #0D9488 0%, #14B8A6 45%, #CA8A04 100%)",
    hero: "radial-gradient(ellipse 82% 55% at 78% 0%, color-mix(in srgb, #CA8A04 12%, transparent), transparent 55%), radial-gradient(ellipse 62% 46% at 14% 28%, color-mix(in srgb, #0D9488 11%, transparent), transparent 50%), linear-gradient(180deg, var(--background) 0%, color-mix(in srgb, #F0FDF4 35%, var(--surface)) 100%)",
    soft: "linear-gradient(180deg, var(--background), color-mix(in srgb, #ECFDF5 40%, var(--surface)))",
    button: "linear-gradient(145deg, #0D9488, #14B8A6)",
  },
  motion: {
    hoverMs: 200,
    transitionMs: 240,
    springStiffness: 320,
    springDamping: 34,
    glowIntensity: 0.22,
    easing: "cubic-bezier(0.33, 1, 0.68, 1)",
    moveDistance: 4,
  },
  effects: {
    atmosphere: "s4hana",
    buttonHover: "lift",
    cardHover: "lift",
    particleEffect: "blobs",
    ripple: false,
    floating: false,
    glow: false,
    heroOverlay:
      "radial-gradient(ellipse at 68% 8%, color-mix(in srgb, #CA8A04 10%, transparent), transparent 45%)",
    scrollbarThumb: "color-mix(in srgb, #0D9488 38%, var(--border))",
  },
  derived: {
    button: "transparent",
    buttonFg: "#ffffff",
  },
} satisfies ThemeDefinition;

export default defineThemePlugin("s4hana", definition);
