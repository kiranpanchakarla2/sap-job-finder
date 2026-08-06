"use client";

import Link from "next/link";
import { Bell, LogOut, Search } from "lucide-react";
import { ModeToggle } from "@/components/theme/ModeToggle";
import { signOutClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";

type AppTopbarProps = {
  fullName: string;
  email: string;
};

export function AppTopbar({ fullName, email }: AppTopbarProps) {
  const router = useRouter();
  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const onSignOut = async () => {
    await signOutClient();
    router.push("/signin");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-card/90 px-4 backdrop-blur-md sm:px-6">
      <label className="hidden max-w-md flex-1 items-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 md:flex">
        <Search size={16} className="text-muted" />
        <input
          placeholder="Search jobs, companies…"
          className="w-full bg-transparent text-sm text-text outline-none placeholder:text-muted"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const q = (e.target as HTMLInputElement).value.trim();
              router.push(q ? `/jobs?q=${encodeURIComponent(q)}` : "/jobs");
            }
          }}
        />
      </label>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted transition hover:text-text"
          title="Notifications (coming soon)"
        >
          <Bell size={16} />
        </button>
        <ModeToggle />
        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-xl border border-border bg-surface px-2.5 py-1.5"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
            {initials || "U"}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-xs font-semibold text-text">{fullName}</span>
            <span className="block text-[11px] text-muted">{email}</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted transition hover:text-error"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
