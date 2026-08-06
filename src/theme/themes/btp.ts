import { defineThemePlugin } from "../theme-registry";
import type { ThemeDefinition } from "../theme-types";

/**
 * BTP Cloud — SAP Business Technology Platform.
 * Electric cyan + violet integration palette, glass surfaces, fluid motion.
 */
const definition = {
  colors: {
    primary: "#0891B2",
    accent: "#7C3AED",
    success: "#2DD4BF",
    warning: "#FBBF24",
    error: "#F43F5E",
    ring: "color-mix(in srgb, #0891B2 24%, transparent)",
  },
  typography: {
    fontHeading: "var(--font-manrope), var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    fontBody: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    fontSans: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
    trackingHeading: "-0.03em",
    weightHeading: "700",
  },
  radius: {
    card: "20px",
    control: "14px",
    button: "9999px",
    pill: "9999px",
  },
  glass: {
    fill: "color-mix(in srgb, var(--surface) 58%, transparent)",
    blur: "24px",
    saturate: "1.4",
    border: "color-mix(in srgb, var(--primary) 20%, var(--border))",
  },
  shadows: {
    soft: "0 8px 28px color-mix(in srgb, #0891B2 12%, transparent)",
    lift: "0 18px 52px color-mix(in srgb, #7C3AED 14%, transparent)",
    glow: "0 0 0 1px color-mix(in srgb, #2DD4BF 20%, transparent), 0 14px 40px color-mix(in srgb, #0891B2 22%, transparent)",
    button: "0 10px 32px color-mix(in srgb, #0891B2 34%, transparent)",
  },
  gradients: {
    brand: "linear-gradient(135deg, #0891B2 0%, #7C3AED 55%, #22D3EE 100%)",
    hero: "radial-gradient(ellipse 90% 60% at 8% 0%, color-mix(in srgb, #22D3EE 18%, transparent), transparent 55%), radial-gradient(ellipse 72% 50% at 92% 22%, color-mix(in srgb, #7C3AED 14%, transparent), transparent 50%), linear-gradient(180deg, var(--background) 0%, color-mix(in srgb, #ECFEFF 40%, var(--surface)) 100%)",
    soft: "linear-gradient(180deg, var(--background), color-mix(in srgb, #F0FDFA 45%, var(--surface)))",
    button: "linear-gradient(135deg, #0891B2, #7C3AED)",
  },
  motion: {
    hoverMs: 240,
    transitionMs: 320,
    springStiffness: 280,
    springDamping: 28,
    glowIntensity: 0.4,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    moveDistance: 8,
  },
  effects: {
    atmosphere: "btp",
    buttonHover: "ripple",
    cardHover: "soft",
    particleEffect: "circles",
    ripple: true,
    floating: true,
    glow: false,
    heroOverlay:
      "radial-gradient(ellipse at 28% 18%, color-mix(in srgb, #7C3AED 12%, transparent), transparent 50%)",
    scrollbarThumb: "color-mix(in srgb, #0891B2 42%, var(--border))",
  },
  derived: {
    button: "transparent",
    buttonFg: "#ffffff",
    navbar: "color-mix(in srgb, var(--background) 68%, transparent)",
  },
} satisfies ThemeDefinition;

export default defineThemePlugin("btp", definition);
