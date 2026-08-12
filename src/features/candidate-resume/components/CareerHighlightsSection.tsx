"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { getFocusableElements, trapFocus } from "@/components/theme/theme-a11y";
import { AuthTextarea } from "@/components/auth/AuthTextarea";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { HIGHLIGHT_MAX_CHARS } from "../lib/resumeUtils";
import type { CareerHighlight } from "../types/resume.types";
import { SectionCard } from "./SectionCard";

function HighlightModal({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial?: CareerHighlight | null;
  onClose: () => void;
  onSave: (text: string, id?: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!open) return;
    setText(initial?.text ?? "");
    setError(undefined);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusables = panel ? getFocusableElements(panel) : [];
    window.requestAnimationFrame(() => {
      (focusables[0] ?? panel)?.focus({ preventScroll: true });
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (panel) trapFocus(event, panel);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <motion.button
            type="button"
            aria-label="Dismiss dialog"
            className="absolute inset-0 bg-black/40"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
            className="relative z-10 w-full max-w-lg rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-lift sm:p-6"
          >
            <h2 id={titleId} className="text-lg font-semibold text-text">
              {initial ? "Edit Highlight" : "Add Highlight"}
            </h2>
            <div className="mt-5">
              <AuthTextarea
                label="Career Highlight"
                rows={4}
                value={text}
                error={error}
                maxLength={HIGHLIGHT_MAX_CHARS + 20}
                onChange={(e) => setText(e.target.value)}
              />
              <p className="mt-2 text-right text-xs text-muted">
                {text.length}/{HIGHLIGHT_MAX_CHARS}
              </p>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                className="!px-4 !py-2.5"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                className="!px-4 !py-2.5"
                onClick={() => {
                  const trimmed = text.trim();
                  if (!trimmed) {
                    setError("Highlight text is required");
                    return;
                  }
                  if (trimmed.length > HIGHLIGHT_MAX_CHARS) {
                    setError(`Keep highlights under ${HIGHLIGHT_MAX_CHARS} characters`);
                    return;
                  }
                  onSave(trimmed, initial?.id);
                }}
              >
                {initial ? "Save Changes" : "Add Highlight"}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export function CareerHighlightsSection({
  highlights,
  onChange,
  onRequestDelete,
}: {
  highlights: CareerHighlight[];
  onChange: (next: CareerHighlight[]) => void;
  onRequestDelete?: (id: string) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CareerHighlight | null>(null);
  const sorted = [...highlights].sort((a, b) => a.order - b.order);

  const move = (id: string, direction: -1 | 1) => {
    const index = sorted.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sorted.length) return;
    const next = [...sorted];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next.map((entry, order) => ({ ...entry, order: order + 1 })));
  };

  return (
    <>
      <SectionCard
        title="Career Highlights"
        description="Highlight achievements that help employers quickly understand your impact."
        action={
          <Button
            type="button"
            variant="secondary"
            className="!px-3 !py-2 text-xs"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus size={14} aria-hidden="true" />
            Add Highlight
          </Button>
        }
      >
        {sorted.length ? (
          <ul className="space-y-3">
            {sorted.map((item, index) => (
              <li
                key={item.id}
                className="rounded-2xl border border-border bg-surface/40 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <p className="text-sm text-text">{item.text}</p>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      className="!px-2 !py-1.5 text-xs"
                      disabled={index === 0}
                      aria-label="Move highlight up"
                      onClick={() => move(item.id, -1)}
                    >
                      <ArrowUp size={13} aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="!px-2 !py-1.5 text-xs"
                      disabled={index === sorted.length - 1}
                      aria-label="Move highlight down"
                      onClick={() => move(item.id, 1)}
                    >
                      <ArrowDown size={13} aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="!px-2.5 !py-1.5 text-xs"
                      onClick={() => {
                        setEditing(item);
                        setModalOpen(true);
                      }}
                    >
                      <Pencil size={13} aria-hidden="true" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="!px-2.5 !py-1.5 text-xs !text-error hover:!bg-error/10"
                      onClick={() => {
                        if (onRequestDelete) {
                          onRequestDelete(item.id);
                          return;
                        }
                        onChange(highlights.filter((h) => h.id !== item.id));
                        toast.success("Career highlight deleted.");
                      }}
                    >
                      <Trash2 size={13} aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No career highlights yet"
            description="Add achievements that showcase your impact."
            icon={Sparkles}
            action={
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
              >
                <Plus size={15} aria-hidden="true" />
                Add Highlight
              </Button>
            }
          />
        )}
      </SectionCard>

      <HighlightModal
        open={modalOpen}
        initial={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={(text, id) => {
          if (id) {
            onChange(
              highlights.map((item) =>
                item.id === id ? { ...item, text } : item,
              ),
            );
          } else {
            onChange([
              ...highlights,
              {
                id: `hl-${Date.now()}`,
                text,
                order: highlights.length + 1,
              },
            ]);
          }
          setModalOpen(false);
          setEditing(null);
          toast.success(
            id ? "Career highlight updated." : "Career highlight added.",
          );
        }}
      />
    </>
  );
}
