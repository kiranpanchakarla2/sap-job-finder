"use client";

import { useEffect, useId, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import {
  THEME_MODE_OPTIONS,
  useTheme,
  type ThemeMode,
} from "@/theme";
import { announceThemeChange, moveRadioSelection } from "./theme-a11y";
import { themeTransition } from "./theme-motion";

const MODE_META: Record<
  ThemeMode,
  { label: string; icon: LucideIcon; description: string }
> = {
  light: { label: "Light", icon: Sun, description: "Always use light appearance" },
  dark: { label: "Dark", icon: Moon, description: "Always use dark appearance" },
  system: {
    label: "System",
    icon: Monitor,
    description: "Match the device color scheme",
  },
};

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)]";

export type ModeToggleProps = {
  className?: string;
  layoutId?: string;
  showLabels?: boolean;
  "aria-label"?: string;
};

/**
 * Reusable appearance mode toggle (Light · Dark · System).
 * Keyboard: Arrow keys, Home, End. Announces changes to screen readers.
 */
export function ModeToggle({
  className = "",
  layoutId = "mode-toggle-pill",
  showLabels = true,
  "aria-label": ariaLabel = "Color mode",
}: ModeToggleProps) {
  const { mode, resolvedMode, systemMode, setMode } = useTheme();
  const reduceMotion = useReducedMotion();
  const groupId = useId();
  const buttonRefs = useRef<Partial<Record<ThemeMode, HTMLButtonElement | null>>>(
    {},
  );
  const selectionTransition = themeTransition(reduceMotion, "base");
  const hoverTransition = themeTransition(reduceMotion, "fast");

  useEffect(() => {
    const buttons = Object.values(buttonRefs.current).filter(Boolean);
    const groupHasFocus = buttons.some(
      (el) => el === document.activeElement,
    );
    if (groupHasFocus) {
      buttonRefs.current[mode]?.focus({ preventScroll: true });
    }
  }, [mode]);

  const applyMode = (next: ThemeMode) => {
    if (next === mode) return;
    setMode(next);
    const label = MODE_META[next].label;
    const detail =
      next === "system"
        ? `System mode selected. Currently resolves to ${systemMode}.`
        : `${label} mode selected.`;
    announceThemeChange(detail);
  };

  return (
    <div
      className={`grid grid-cols-3 gap-1 rounded-2xl p-1 ${className}`.trim()}
      style={{
        background: "color-mix(in srgb, var(--background) 70%, var(--surface))",
      }}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-describedby={`${groupId}-hint`}
      onKeyDown={(event) => {
        const next = moveRadioSelection(THEME_MODE_OPTIONS, mode, event.key);
        if (!next) return;
        event.preventDefault();
        applyMode(next);
      }}
    >
      {THEME_MODE_OPTIONS.map((id) => {
        const { label, icon: Icon, description } = MODE_META[id];
        const selected = mode === id;

        return (
          <motion.button
            key={id}
            ref={(node) => {
              buttonRefs.current[id] = node;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            aria-label={`${label}. ${description}${
              id === "system" ? ` Currently ${resolvedMode}.` : ""
            }`}
            title={
              id === "system" ? `${description} · ${resolvedMode}` : description
            }
            onClick={() => applyMode(id)}
            whileHover={reduceMotion ? undefined : { scale: 1.03 }}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            transition={hoverTransition}
            className={`relative flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-semibold tracking-tight ${FOCUS_RING}`}
          >
            {selected ? (
              <motion.span
                layoutId={reduceMotion ? undefined : layoutId}
                className="absolute inset-0 rounded-xl shadow-sm"
                style={{
                  background: "color-mix(in srgb, var(--surface) 96%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--border) 90%, transparent)",
                }}
                transition={selectionTransition}
                aria-hidden
              />
            ) : null}

            <motion.span
              className="relative z-[1] inline-flex h-7 w-7 items-center justify-center rounded-lg"
              aria-hidden
              animate={
                reduceMotion
                  ? { color: selected ? "var(--primary)" : "var(--muted-text)" }
                  : {
                      scale: selected ? 1.05 : 1,
                      color: selected ? "var(--primary)" : "var(--muted-text)",
                    }
              }
              transition={selectionTransition}
            >
              <Icon size={15} strokeWidth={2.25} />
            </motion.span>

            {showLabels ? (
              <motion.span
                className="relative z-[1]"
                aria-hidden
                animate={{
                  color: selected ? "var(--text)" : "var(--muted-text)",
                }}
                transition={selectionTransition}
              >
                {label}
              </motion.span>
            ) : null}
          </motion.button>
        );
      })}

      <span id={`${groupId}-hint`} className="sr-only">
        {mode === "system"
          ? `System mode is active and currently resolves to ${resolvedMode}. Use arrow keys to change mode.`
          : `${MODE_META[mode].label} mode is active. Use arrow keys to change mode.`}
      </span>
    </div>
  );
}
