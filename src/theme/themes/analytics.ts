import { defineThemePlugin } from "../theme-registry";
import type { ThemeDefinition } from "../theme-types";

/**
 * Analytics Cloud — modern insights palette.
 * Violet → magenta → coral gradients with confident glow motion.
 */
const definition = {
  colors: {
    primary: "#8B5CF6",
    accent: "#EC4899",
    success: "#06B6D4",
    warning: "#FB923C",
    error: "#EF4444",
    ring: "color-mix(in srgb, #8B5CF6 26%, transparent)",
  },
  typography: {
    fontHeading:
      "var(--font-space-grotesk), var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    fontBody: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    fontSans: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    trackingHeading: "-0.035em",
    weightHeading: "700",
  },
  radius: {
    card: "14px",
    control: "10px",
    button: "12px",
  },
  glass: {
    fill: "color-mix(in srgb, var(--surface) 76%, transparent)",
    blur: "18px",
    saturate: "1.3",
    border: "color-mix(in srgb, #8B5CF6 20%, var(--border))",
  },
  shadows: {
    soft: "0 6px 26px color-mix(in srgb, #8B5CF6 14%, transparent)",
    lift: "0 18px 48px color-mix(in srgb, #EC4899 16%, transparent)",
    glow: "0 0 0 1px color-mix(in srgb, #FB923C 22%, transparent), 0 0 32px color-mix(in srgb, #8B5CF6 32%, transparent), 0 14px 40px color-mix(in srgb, #EC4899 20%, transparent)",
    button:
      "0 0 0 1px color-mix(in srgb, #EC4899 24%, transparent), 0 10px 32px color-mix(in srgb, #8B5CF6 38%, transparent)",
  },
  gradients: {
    brand: "linear-gradient(125deg, #8B5CF6 0%, #EC4899 50%, #FB923C 100%)",
    hero: "radial-gradient(ellipse 72% 52% at 18% 8%, color-mix(in srgb, #8B5CF6 20%, transparent), transparent 50%), radial-gradient(ellipse 58% 42% at 86% 14%, color-mix(in srgb, #EC4899 16%, transparent), transparent 45%), linear-gradient(180deg, var(--background) 0%, color-mix(in srgb, #FAF5FF 42%, var(--surface)) 100%)",
    soft: "linear-gradient(180deg, var(--background), color-mix(in srgb, #FDF4FF 38%, var(--surface)))",
    button: "linear-gradient(125deg, #8B5CF6, #EC4899 65%, #FB923C)",
  },
  motion: {
    hoverMs: 120,
    transitionMs: 160,
    springStiffness: 480,
    springDamping: 26,
    glowIntensity: 0.7,
    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    moveDistance: 5,
  },
  effects: {
    atmosphere: "analytics",
    buttonHover: "glow",
    cardHover: "glow",
    particleEffect: "rays",
    ripple: false,
    floating: true,
    glow: true,
    heroOverlay:
      "radial-gradient(ellipse at 50% 0%, color-mix(in srgb, #8B5CF6 16%, transparent), transparent 42%)",
    scrollbarThumb: "color-mix(in srgb, #8B5CF6 46%, var(--border))",
  },
  derived: {
    button: "transparent",
    buttonFg: "#ffffff",
    focusRing: "color-mix(in srgb, #EC4899 50%, var(--text))",
  },
} satisfies ThemeDefinition;

export default defineThemePlugin("analytics", definition);
