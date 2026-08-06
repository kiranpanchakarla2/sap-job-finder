"use client";

import { usePathname } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { useTheme } from "@/theme/theme-context";

/**
 * Routes where atmosphere decorations are suppressed (editing focus).
 */
const DISTRACTION_FREE_PREFIXES = [
  "/builder",
  "/dashboard",
  "/admin",
  "/signin",
  "/signup",
  "/institutions/login",
  "/institutions/dashboard",
];

function isDistractionFree(pathname: string | null): boolean {
  if (!pathname) return false;
  return DISTRACTION_FREE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Token-driven decorative layer. Never branches on theme ids in consumers —
 * personality comes from `tokens.effects` / `data-atmosphere` on `<html>`.
 *
 * Lightweight CSS shapes only; continuous motion pauses under reduced-motion.
 */
export function ThemeAtmosphere() {
  const { tokens } = useTheme();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const { atmosphere, floating, particleEffect } = tokens.effects;

  if (atmosphere === "none" || isDistractionFree(pathname)) {
    return null;
  }

  const animate = !reduceMotion && floating;
  const showParticles = particleEffect !== "none";

  return (
    <div
      className="theme-atmosphere pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
      data-atmosphere-layer={atmosphere}
      data-animate={animate ? "true" : "false"}
    >
      <div className="theme-atmosphere__wash" />
      <div className="theme-atmosphere__orb theme-atmosphere__orb--a" />
      <div className="theme-atmosphere__orb theme-atmosphere__orb--b" />
      <div className="theme-atmosphere__orb theme-atmosphere__orb--c" />
      {showParticles ? <div className="theme-atmosphere__particles" /> : null}
    </div>
  );
}
