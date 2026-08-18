"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";
import type { NavMenuConfig } from "@/lib/main-nav";

type NavMenuPanelProps = {
  menu: NavMenuConfig | null;
  onNavigate: () => void;
  /** When true, panel is absolutely positioned under its trigger (dropdowns). */
  anchored?: boolean;
};

export function NavMenuPanel({
  menu,
  onNavigate,
  anchored = false,
}: NavMenuPanelProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const isDropdown = menu?.variant === "dropdown";
  const columnCount = menu?.columns.length ?? 1;

  return (
    <AnimatePresence mode="wait">
      {menu ? (
        <motion.div
          key={anchored ? menu.id : "mega-panel-container"}
          role="menu"
          aria-label={`${menu.label} menu`}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: 4 }}
          transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className={
            anchored
              ? "absolute left-0 top-full z-[60] w-[min(22rem,calc(100vw-2rem))] pt-3"
              : columnCount === 2
                ? "relative z-[60] w-[min(480px,calc(100vw-2rem))] pt-3 transition-[width] duration-200 ease-out"
                : columnCount === 3
                  ? "relative z-[60] w-[min(640px,calc(100vw-2rem))] pt-3 transition-[width] duration-200 ease-out"
                  : columnCount === 4
                    ? "relative z-[60] w-[min(820px,calc(100vw-2rem))] pt-3 transition-[width] duration-200 ease-out"
                    : "relative z-[60] w-[min(920px,calc(100vw-2rem))] pt-3 transition-[width] duration-200 ease-out"
          }
        >
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-card/95 shadow-lift backdrop-blur-[var(--glass-blur,20px)]">
            <div
              key={menu.id}
              className={`grid gap-y-4 px-5 py-4 transition-opacity duration-150 sm:px-6 sm:py-5 ${
                isDropdown
                  ? "grid-cols-1 gap-x-6"
                  : columnCount === 2
                    ? "grid-cols-1 gap-x-8 sm:grid-cols-2"
                    : columnCount === 4
                      ? "grid-cols-2 gap-x-5 lg:grid-cols-4 lg:gap-x-6"
                      : columnCount === 3
                        ? "grid-cols-1 gap-x-8 sm:grid-cols-3"
                        : "grid-cols-2 gap-x-6 md:grid-cols-3 lg:grid-cols-5"
              }`}
            >
              {menu.columns.map((column, index) => (
                <div
                  key={column.title}
                  className={
                    isDropdown && index > 0
                      ? "border-t border-border/70 pt-3"
                      : undefined
                  }
                >
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                      {column.title}
                    </p>
                    {column.badge === "SOON" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-muted/15 px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted whitespace-nowrap">
                        <Clock size={10} className="shrink-0 opacity-70" aria-hidden="true" />
                        Soon
                      </span>
                    ) : null}
                  </div>
                  <ul className="mt-2 space-y-0.5">
                    {column.links.map((link) => {
                      const active =
                        pathname === link.href ||
                        (!link.href.includes("?") &&
                          !link.href.includes("#") &&
                          link.href !== "/" &&
                          pathname.startsWith(link.href));

                      return (
                        <li key={`${column.title}-${link.label}`}>
                          <Link
                            href={link.href}
                            role="menuitem"
                            onClick={onNavigate}
                            className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] leading-snug transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                              active
                                ? "bg-primary/10 font-semibold text-primary"
                                : link.featured
                                  ? "font-semibold text-text hover:bg-surface hover:translate-x-0.5"
                                  : "text-muted hover:bg-surface hover:text-text hover:translate-x-0.5"
                            }`}
                          >
                            <span className="min-w-0 flex-1 truncate">{link.label}</span>
                            {link.badge === "NEW" ? (
                              <span className="shrink-0 rounded-full bg-gradient-to-r from-primary to-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-xs">
                                NEW
                              </span>
                            ) : link.badge === "COMING SOON" ? (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded bg-muted/15 px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted whitespace-nowrap">
                                <Clock size={10} className="shrink-0 opacity-70" aria-hidden="true" />
                                Soon
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            <div className="border-t border-border/70 bg-surface/40 px-5 py-2.5 sm:px-6">
              <Link
                href={menu.footer.href}
                onClick={onNavigate}
                className="group inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {menu.footer.label}
                <ArrowRight size={14} className="transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
