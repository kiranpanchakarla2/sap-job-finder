import { defineThemePlugin } from "../theme-registry";
import type { ThemeDefinition } from "../theme-types";

/**
 * Fiori UX — modern SAP Fiori-inspired enterprise neutral theme.
 * Graphite + silver + cool grey with a subtle steel-blue accent.
 */
const definition = {
  colors: {
    primary: "#374151",
    accent: "#64748B",
    success: "#059669",
    warning: "#D97706",
    error: "#DC2626",
    ring: "color-mix(in srgb, #64748B 22%, transparent)",
  },
  typography: {
    fontHeading:
      "var(--font-outfit), var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    fontBody: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    fontSans: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    trackingHeading: "-0.03em",
    weightHeading: "600",
  },
  radius: {
    card: "18px",
    control: "12px",
    button: "12px",
  },
  glass: {
    fill: "color-mix(in srgb, var(--card) 82%, transparent)",
    blur: "18px",
    saturate: "1.08",
    border: "color-mix(in srgb, #CBD5E1 70%, var(--border))",
  },
  shadows: {
    soft: "0 4px 20px color-mix(in srgb, #374151 6%, transparent)",
    lift: "0 14px 40px color-mix(in srgb, #4B5563 10%, transparent)",
    glow: "0 0 0 1px color-mix(in srgb, #4B5563 28%, transparent), 0 8px 28px color-mix(in srgb, #374151 10%, transparent)",
    button: "0 6px 18px color-mix(in srgb, #374151 22%, transparent)",
  },
  gradients: {
    brand: "linear-gradient(135deg, #E5E7EB 0%, #F8FAFC 50%, #CBD5E1 100%)",
    hero: "radial-gradient(ellipse 80% 55% at 50% -6%, color-mix(in srgb, #CBD5E1 28%, transparent), transparent 55%), radial-gradient(ellipse 55% 40% at 92% 24%, color-mix(in srgb, #9CA3AF 10%, transparent), transparent 50%), linear-gradient(180deg, var(--background) 0%, color-mix(in srgb, #F8FAFC 70%, var(--surface)) 100%)",
    soft: "linear-gradient(180deg, var(--background), color-mix(in srgb, #F1F5F9 55%, var(--surface)))",
    button: "linear-gradient(135deg, #374151 0%, #4B5563 100%)",
  },
  motion: {
    hoverMs: 200,
    transitionMs: 280,
    springStiffness: 260,
    springDamping: 32,
    glowIntensity: 0.12,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    moveDistance: 6,
  },
  effects: {
    atmosphere: "fiori",
    buttonHover: "fade",
    cardHover: "soft",
    particleEffect: "dots",
    ripple: false,
    floating: false,
    glow: false,
    heroOverlay:
      "radial-gradient(ellipse at 50% 0%, color-mix(in srgb, #CBD5E1 18%, transparent), transparent 52%)",
    scrollbarThumb: "color-mix(in srgb, #6B7280 42%, var(--border))",
  },
  derived: {
    button: "transparent",
    buttonFg: "#ffffff",
    badge: "color-mix(in srgb, #64748B 12%, var(--surface))",
    badgeFg: "#4B5563",
    navbar: "color-mix(in srgb, var(--background) 72%, transparent)",
    focusRing: "color-mix(in srgb, #64748B 55%, var(--text))",
  },
} satisfies ThemeDefinition;

export default defineThemePlugin("fiori", definition);
