"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { mainNavMenus, type NavMenuId } from "@/lib/main-nav";
import { NavMenuPanel } from "@/components/nav/NavMenuPanel";

const CLOSE_DELAY_MS = 280;

function isMenuActive(pathname: string, href: string) {
  if (href === "/jobs") return pathname === "/jobs" || pathname.startsWith("/jobs/");
  if (href === "/companies") {
    return pathname === "/companies" || pathname.startsWith("/company/");
  }
  if (href === "/services" || href.startsWith("/services")) {
    return pathname === "/services" || pathname.startsWith("/services/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNavigation() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const navId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [openId, setOpenId] = useState<NavMenuId | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current != null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const closeMenu = useCallback(() => {
    clearCloseTimer();
    setOpenId(null);
  }, [clearCloseTimer]);

  const openMenu = useCallback(
    (id: NavMenuId) => {
      clearCloseTimer();
      setOpenId(id);
    },
    [clearCloseTimer],
  );

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpenId(null);
      closeTimerRef.current = null;
    }, CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (!openId) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [openId, closeMenu]);

  const activeMenu = mainNavMenus.find((menu) => menu.id === openId) ?? null;

  return (
    <>
      {/* Visual dim only — pointer-events none so it never steals hover from the nav */}
      <AnimatePresence>
        {openId ? (
          <motion.div
            aria-hidden="true"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="pointer-events-none fixed inset-0 z-40 bg-background/30 backdrop-blur-[1px]"
          />
        ) : null}
      </AnimatePresence>

      <div
        ref={rootRef}
        className="relative z-50 hidden md:block"
        onMouseLeave={scheduleClose}
        onMouseEnter={clearCloseTimer}
      >
        <nav className="flex items-center gap-0.5" aria-label="Primary">
          {mainNavMenus.map((menu) => {
            const open = openId === menu.id;
            const active = isMenuActive(pathname, menu.href);
            const buttonId = `${navId}-${menu.id}`;

            return (
              <div key={menu.id} className="relative">
                <Link
                  id={buttonId}
                  href={menu.href}
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
                    open || active ? "text-text" : "text-muted hover:text-text"
                  }`}
                  aria-expanded={open}
                  aria-haspopup="true"
                  aria-controls={
                    menu.variant === "dropdown" ? `${buttonId}-panel` : `${navId}-mega-panel`
                  }
                  onMouseEnter={() => openMenu(menu.id)}
                  onFocus={() => openMenu(menu.id)}
                  onClick={closeMenu}
                >
                  {menu.label}
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </Link>

                {menu.variant === "dropdown" && open ? (
                  <div id={`${buttonId}-panel`}>
                    {/* Invisible bridge from trigger into panel */}
                    <div className="absolute inset-x-0 top-full h-3" aria-hidden="true" />
                    <NavMenuPanel menu={menu} onNavigate={closeMenu} anchored />
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        {activeMenu?.variant === "mega" ? (
          <div id={`${navId}-mega-panel`} className="absolute left-1/2 top-full z-[60] -translate-x-1/2">
            {/* Invisible bridge across the full nav width into the mega panel */}
            <div className="absolute inset-x-0 top-0 h-3 -translate-y-full" aria-hidden="true" />
            <NavMenuPanel menu={activeMenu} onNavigate={closeMenu} />
          </div>
        ) : null}

        <div className="sr-only">
          {mainNavMenus.map((menu) => (
            <Link key={menu.id} href={menu.href}>
              {menu.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
