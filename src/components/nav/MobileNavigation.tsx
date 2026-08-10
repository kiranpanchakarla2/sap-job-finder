"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { AuthActions } from "@/components/nav/AuthActions";
import { mainNavMenus, type NavMenuId } from "@/lib/main-nav";

type MobileNavigationProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileNavigation({ open, onClose }: MobileNavigationProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<NavMenuId | null>(null);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="max-h-[calc(100vh-5rem)] overflow-y-auto border-b border-border bg-card px-5 py-4 shadow-soft md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile primary">
            {mainNavMenus.map((menu) => {
              const isExpanded = expanded === menu.id;

              return (
                <div key={menu.id} className="rounded-xl border border-transparent">
                  <button
                    type="button"
                    onClick={() => setExpanded(isExpanded ? null : menu.id)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                    aria-expanded={isExpanded}
                  >
                    {menu.label}
                    <ChevronDown
                      size={16}
                      className={`text-muted transition-transform duration-150 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {isExpanded ? (
                    <div className="mb-2 ml-2 flex flex-col gap-3 border-l border-border pl-3">
                      {menu.columns.map((column) => (
                        <div key={column.title}>
                          <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                            {column.title}
                          </p>
                          <div className="flex flex-col gap-0.5">
                            {column.links.map((link) => (
                              <Link
                                key={`${column.title}-${link.label}`}
                                href={link.href}
                                onClick={onClose}
                                className={`rounded-lg px-3 py-2 text-sm ${
                                  pathname === link.href
                                    ? "font-semibold text-primary"
                                    : "text-muted hover:text-text"
                                }`}
                              >
                                <span className="inline-flex items-center gap-2">
                                  {link.label}
                                  {link.badge ? (
                                    <span className="rounded-full bg-gradient-to-r from-primary to-accent px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                                      {link.badge}
                                    </span>
                                  ) : null}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                      <Link
                        href={menu.footer.href}
                        onClick={onClose}
                        className="px-3 py-2 text-sm font-semibold text-primary"
                      >
                        {menu.footer.label} →
                      </Link>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <AuthActions variant="mobile" onNavigate={onClose} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
