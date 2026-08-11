"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { Button } from "@/components/ui/Button";

export function AnalyticsExportMenu() {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        const trigger = rootRef.current?.querySelector("button");
        trigger?.focus();
        return;
      }
      if (menuRef.current) trapFocus(event, menuRef.current);
    };

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onPointerDown);
    window.requestAnimationFrame(() => {
      const focusables = menuRef.current
        ? getFocusableElements(menuRef.current)
        : [];
      focusables[0]?.focus({ preventScroll: true });
    });

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  const onExport = (format: "CSV" | "PDF") => {
    setOpen(false);
    toast.message("Report export is coming soon.", {
      description: `${format} export will be available in a future update.`,
    });
  };

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="secondary"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <Download size={16} aria-hidden="true" />
        Export Report
      </Button>

      <AnimatePresence>
        {open ? (
          <motion.div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label="Export options"
            initial={reduceMotion ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
            className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-[var(--radius-card)] border border-border bg-card shadow-lift"
          >
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface focus-visible:bg-surface focus-visible:outline-none"
              onClick={() => onExport("CSV")}
            >
              Export CSV
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface focus-visible:bg-surface focus-visible:outline-none"
              onClick={() => onExport("PDF")}
            >
              Export PDF
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
