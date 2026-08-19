import { Bell, Menu, Shield } from "lucide-react";
import { AdminUserMenu } from "./AdminUserMenu";

type AdminTopHeaderProps = {
  onMenuClick: () => void;
  title?: string;
  subtitle?: string;
};

export function AdminTopHeader({ onMenuClick, title, subtitle }: AdminTopHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-card/90 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted transition hover:bg-surface hover:text-text lg:hidden focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          aria-label="Open administrative navigation drawer"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield size={14} aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-text sm:text-base">
                {title || "Super Admin Portal"}
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20">
                Internal Only
              </span>
            </div>
            {subtitle && (
              <p className="hidden text-xs text-muted md:block truncate max-w-md">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted transition hover:bg-surface hover:text-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          title="Administrative notifications (coming soon)"
          aria-label="Admin notifications"
        >
          <Bell size={16} />
        </button>

        <div className="h-5 w-px bg-border mx-0.5" aria-hidden="true" />

        <AdminUserMenu />
      </div>
    </header>
  );
}
