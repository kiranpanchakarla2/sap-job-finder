"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { TeamMember } from "../types/team.types";

export type TeamMemberAction =
  | "view"
  | "changeRole"
  | "suspend"
  | "activate"
  | "remove";

export function TeamMemberActionsMenu({
  member,
  isSelf,
  onAction,
}: {
  member: TeamMember;
  isSelf: boolean;
  onAction: (action: TeamMemberAction) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const isOwner = member.role === "owner";

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

  const items: { action: TeamMemberAction; label: string; danger?: boolean }[] = [
    { action: "view", label: "View Profile" },
  ];

  if (!isOwner) {
    items.push({ action: "changeRole", label: "Change Role" });
    if (member.status === "suspended") {
      items.push({ action: "activate", label: "Reactivate Access" });
    } else {
      items.push({ action: "suspend", label: "Suspend Access", danger: true });
    }
    if (!isSelf) {
      items.push({ action: "remove", label: "Remove Member", danger: true });
    }
  }

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Actions for ${member.email || "team member"}`}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted transition hover:border-primary/30 hover:text-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
      >
        <MoreHorizontal size={16} aria-hidden="true" />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-[11rem] rounded-xl border border-border bg-card p-1 shadow-lift"
        >
          {items.map((item) => (
            <button
              key={item.action}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onAction(item.action);
              }}
              className={`flex w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                item.danger
                  ? "text-error hover:bg-error/10"
                  : "text-text hover:bg-surface"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
