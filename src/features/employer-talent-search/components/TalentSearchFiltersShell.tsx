"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { Button } from "@/components/ui/Button";
import { countActiveFilters } from "../config/talentSearchFilters";
import type { TalentSearchFilters } from "../types/talentSearch.types";
import { TalentSearchFiltersPanel } from "./TalentSearchFilters";

export function TalentSearchDesktopFilters({
  filters,
  onChange,
  onClear,
}: {
  filters: TalentSearchFilters;
  onChange: (patch: Partial<TalentSearchFilters>) => void;
  onClear: () => void;
}) {
  return (
    <aside className="hidden w-[300px] shrink-0 lg:block">
      <div className="sticky top-4 max-h-[calc(100vh-6rem)] overflow-hidden rounded-[var(--radius-card)] border border-border bg-card shadow-soft">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-text">Filters</h2>
        </div>
        <div className="max-h-[calc(100vh-9rem)] overflow-y-auto">
          <TalentSearchFiltersPanel
            filters={filters}
            onChange={onChange}
            onClear={onClear}
          />
        </div>
      </div>
    </aside>
  );
}

export function TalentSearchMobileFilters({
  filters,
  onApply,
  onClear,
}: {
  filters: TalentSearchFilters;
  onApply: (next: TalentSearchFilters) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const activeCount = countActiveFilters(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = panel ? getFocusableElements(panel) : [];
    window.requestAnimationFrame(() => {
      (focusables[0] ?? panel)?.focus({ preventScroll: true });
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (panel) trapFocus(event, panel);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <Button
        type="button"
        variant="secondary"
        className="!px-3 !py-2 text-xs"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal size={14} aria-hidden="true" />
        {activeCount > 0 ? `Filters (${activeCount})` : "Filters"}
      </Button>

      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.button
              type="button"
              aria-label="Dismiss filters"
              className="absolute inset-0 bg-black/40"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              initial={reduceMotion ? false : { y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduceMotion ? undefined : { y: 16, opacity: 0 }}
              className="relative z-10 flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-[1.5rem] border border-border bg-card shadow-lift"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h2 id={titleId} className="text-base font-semibold text-text">
                  {activeCount > 0 ? `Filters (${activeCount})` : "Filters"}
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  className="!px-3 !py-2 text-xs"
                  onClick={() => setOpen(false)}
                >
                  Close
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <TalentSearchFiltersPanel
                  filters={draft}
                  onChange={(patch) =>
                    setDraft((prev) => ({ ...prev, ...patch }))
                  }
                  onClear={() => {
                    onClear();
                    setOpen(false);
                  }}
                  showApply
                  onApply={() => {
                    onApply(draft);
                    setOpen(false);
                  }}
                />
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
