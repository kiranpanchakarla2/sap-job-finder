"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { useRouter } from "next/navigation";
import type { AuthRole } from "@/types/auth";

function roleLabel(role: AuthRole) {
  switch (role) {
    case "employer":
      return "Employer";
    case "admin":
      return "Admin";
    default:
      return "Candidate";
  }
}

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!user) return null;

  const profileHref =
    user.role === "employer" ? "/employer/company-profile" : "/candidate/profile";
  const settingsHref =
    user.role === "employer" ? "/employer/settings" : "/candidate/settings";
  const profileLabel = user.role === "employer" ? "Company Profile" : "My Profile";
  const displayName = user.role === "employer" && user.companyName ? user.companyName : user.name;
  const initials =
    user.avatarInitials ||
    displayName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const onLogout = async () => {
    const redirect = await logout();
    setOpen(false);
    router.push(redirect);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-border bg-surface px-2.5 py-1.5 transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="User menu"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
          {initials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block max-w-[140px] truncate text-xs font-semibold text-text">
            {displayName}
          </span>
          <span className="block text-[11px] text-muted">{roleLabel(user.role)}</span>
        </span>
        <ChevronDown size={14} className="hidden text-muted sm:block" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-border bg-card py-1 shadow-lift"
        >
          <Link
            href={profileHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-text transition hover:bg-surface"
          >
            <UserRound size={15} aria-hidden="true" />
            {profileLabel}
          </Link>
          <Link
            href={settingsHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-text transition hover:bg-surface"
          >
            <Settings size={15} aria-hidden="true" />
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={onLogout}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={15} aria-hidden="true" />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
