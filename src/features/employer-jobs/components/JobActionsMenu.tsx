"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { getAllowedJobActions, jobActionLabel } from "../lib/actions";
import type { JobAction, JobStatus } from "../types/job.types";

export function JobActionsMenu({
  status,
  onAction,
  align = "right",
}: {
  status: JobStatus;
  onAction: (action: JobAction) => void;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const actions = getAllowedJobActions(status);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("touchstart", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Job actions"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted transition hover:border-primary/30 hover:text-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
      >
        <MoreHorizontal size={16} aria-hidden="true" />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className={`absolute z-20 mt-1 min-w-[10.5rem] rounded-xl border border-border bg-card p-1 shadow-lift ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {actions.map((action) => (
            <button
              key={action}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onAction(action);
              }}
              className={`flex w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                action === "delete" || action === "close"
                  ? "text-error hover:bg-error/10"
                  : "text-text hover:bg-surface"
              }`}
            >
              {jobActionLabel(action)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
