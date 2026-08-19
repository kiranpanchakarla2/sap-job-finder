"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, ShieldCheck, User } from "lucide-react";
import { useAdminAuth } from "@/features/admin-auth/hooks/useAdminAuth";

export function AdminUserMenu() {
  const { adminUser, logout } = useAdminAuth();
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

  if (!adminUser) return null;

  const displayName = adminUser.name || adminUser.email;
  const email = adminUser.email;
  const initials =
    adminUser.avatarInitials ||
    displayName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.replace("/admin/login");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        id="admin-user-menu-button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-1.5 transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Super admin user menu"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
          {initials}
        </span>
        <span className="hidden text-left md:block">
          <span className="block max-w-[170px] truncate text-xs font-semibold text-text">
            {displayName}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-medium text-primary">
            <ShieldCheck size={11} aria-hidden="true" />
            Super Admin
          </span>
        </span>
        <ChevronDown size={14} className="hidden text-muted md:block" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-labelledby="admin-user-menu-button"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-lift animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="text-xs font-semibold text-text truncate">{displayName}</p>
            <p className="text-[11px] text-muted truncate mt-0.5">{email}</p>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              <ShieldCheck size={10} />
              Role: Super Admin
            </div>
          </div>

          <div className="py-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-error transition hover:bg-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
            >
              <LogOut size={15} aria-hidden="true" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
