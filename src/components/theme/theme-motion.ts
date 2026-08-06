import type { Transition } from "framer-motion";
import type { ThemeMotionTokens } from "@/theme/theme-types";
import { DEFAULT_THEME_MOTION } from "@/theme/theme-defaults";

/**
 * Fallback motion budget when tokens are unavailable.
 * Prefer {@link getThemeMotionTransition} with live tokens.
 */
export const THEME_MOTION_MS = {
  fast: 120,
  base: 180,
  color: 220,
} as const;

export const THEME_EASE = [0.22, 1, 0.36, 1] as const;

export type ThemeMotionKind = keyof typeof THEME_MOTION_MS;

function parseCssEasing(easing: string): number[] | string {
  const match = easing.match(
    /cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/,
  );
  if (!match) return "easeOut";
  return [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    Number(match[4]),
  ];
}

/**
 * Framer Motion transition from theme motion tokens.
 * Respects `prefers-reduced-motion`.
 */
export function getThemeMotionTransition(
  motion: ThemeMotionTokens = DEFAULT_THEME_MOTION,
  reduceMotion: boolean | null,
  kind: ThemeMotionKind = "base",
): Transition {
  if (reduceMotion) {
    return { duration: 0 };
  }

  const durationMs =
    kind === "fast"
      ? Math.min(motion.hoverMs, 140)
      : kind === "color"
        ? motion.transitionMs
        : motion.hoverMs;

  return {
    duration: durationMs / 1000,
    ease: parseCssEasing(motion.easing) as [number, number, number, number],
  };
}

/**
 * Spring transition from theme motion tokens.
 */
export function getThemeSpringTransition(
  motion: ThemeMotionTokens = DEFAULT_THEME_MOTION,
  reduceMotion: boolean | null,
): Transition {
  if (reduceMotion) {
    return { duration: 0 };
  }

  return {
    type: "spring",
    stiffness: motion.springStiffness,
    damping: motion.springDamping,
  };
}

/**
 * Legacy helper — fixed budget under 250ms.
 * Prefer {@link getThemeMotionTransition} for experience themes.
 */
export function themeTransition(
  reduceMotion: boolean | null,
  kind: ThemeMotionKind = "base",
): Transition {
  if (reduceMotion) {
    return { duration: 0 };
  }

  return {
    duration: THEME_MOTION_MS[kind] / 1000,
    ease: THEME_EASE,
  };
}

/** CSS duration string for non-Framer transitions. */
export function themeCssDuration(
  reduceMotion: boolean | null,
  kind: ThemeMotionKind = "color",
): string {
  if (reduceMotion) return "0ms";
  return `${THEME_MOTION_MS[kind]}ms`;
}
