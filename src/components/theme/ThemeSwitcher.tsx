"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Palette, X } from "lucide-react";
import { useTheme } from "@/theme";
import { ModeToggle } from "./ModeToggle";
import { ThemeCardGrid } from "./ThemeCardGrid";
import { formatThemeCardLabel } from "./theme-card.styles";
import { getFocusableElements, trapFocus } from "./theme-a11y";
import { themeTransition } from "./theme-motion";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)]";

/**
 * Floating theme control with dialog a11y (focus trap, restore, Escape).
 */
export function ThemeSwitcher() {
  const { theme, mode, resolvedMode, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const panelId = useId();
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelTransition = themeTransition(reduceMotion, "base");
  const iconTransition = themeTransition(reduceMotion, "fast");
  const hoverTransition = themeTransition(reduceMotion, "fast");

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = panel ? getFocusableElements(panel) : [];
    const initial = focusables[0] ?? panel;
    window.requestAnimationFrame(() => {
      initial?.focus({ preventScroll: true });
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (panel) {
        trapFocus(event, panel);
      }
    };

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("touchstart", onPointerDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchstart", onPointerDown);

      const restoreTarget =
        triggerRef.current && document.contains(triggerRef.current)
          ? triggerRef.current
          : previouslyFocused;
      restoreTarget?.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6"
    >
      <AnimatePresence>
        {open ? (
          <motion.div
            key="theme-switcher-panel"
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
            transition={panelTransition}
            className="pointer-events-auto flex max-h-[min(36rem,calc(100vh-6.5rem))] w-[min(100vw-2rem,24rem)] flex-col overflow-hidden rounded-[1.75rem] border shadow-[var(--shadow-lift)] backdrop-blur-2xl"
            style={{
              background: "var(--glass)",
              color: "var(--text)",
              borderColor: "color-mix(in srgb, var(--border) 80%, transparent)",
            }}
          >
            <div
              className="relative z-10 flex shrink-0 items-start justify-between gap-3 border-b px-4 py-3.5 sm:px-5"
              style={{
                background: "var(--surface)",
                borderColor: "color-mix(in srgb, var(--border) 70%, transparent)",
              }}
            >
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-text">
                  Appearance
                </p>
                <p
                  id={titleId}
                  className="mt-1 truncate text-sm font-semibold tracking-tight text-text"
                >
                  Theme switcher · {formatThemeCardLabel(theme)} · {mode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-text transition-colors duration-[120ms] ease-out hover:bg-text/[0.06] hover:text-text motion-reduce:transition-none ${FOCUS_RING}`}
                aria-label="Close theme switcher"
              >
                <X size={16} strokeWidth={2.25} aria-hidden />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
              <section aria-labelledby={`${panelId}-mode`}>
                <h2
                  id={`${panelId}-mode`}
                  className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-text"
                >
                  Mode
                </h2>
                <ModeToggle layoutId="theme-switcher-mode-pill" />
              </section>

              <section aria-labelledby={`${panelId}-palette`}>
                <h2
                  id={`${panelId}-palette`}
                  className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-text"
                >
                  Palette
                </h2>
                <ThemeCardGrid
                  mode={resolvedMode}
                  selectedId={theme}
                  onSelect={setTheme}
                  aria-label="Theme palette"
                />
              </section>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={panelId}
        aria-label={
          open
            ? "Close theme switcher"
            : `Open theme switcher. Current theme ${formatThemeCardLabel(theme)}, mode ${mode}.`
        }
        onClick={() => setOpen((current) => !current)}
        whileHover={reduceMotion ? undefined : { scale: 1.04 }}
        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
        transition={hoverTransition}
        className={`pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border shadow-[var(--shadow-lift)] backdrop-blur-xl sm:h-14 sm:w-14 sm:rounded-[1.25rem] ${FOCUS_RING}`}
        style={{
          background: "var(--glass)",
          color: "var(--text)",
          borderColor: "color-mix(in srgb, var(--border) 80%, transparent)",
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "palette"}
            initial={reduceMotion ? false : { opacity: 0, rotate: -12, scale: 0.88 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, rotate: 12, scale: 0.88 }}
            transition={iconTransition}
            className="inline-flex"
            aria-hidden
          >
            {open ? (
              <X size={20} strokeWidth={2.25} />
            ) : (
              <Palette size={20} strokeWidth={2.25} />
            )}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
