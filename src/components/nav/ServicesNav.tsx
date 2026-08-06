"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { getServiceHref, serviceGroups } from "@/lib/services-nav";

type ServicesNavProps = {
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
};

export function ServicesNav({ onNavigate, variant = "desktop" }: ServicesNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isActive = pathname === "/services" || pathname.startsWith("/services/");
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current != null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openMenu = () => {
    clearCloseTimer();
    setOpen(true);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, 400);
  };

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  useEffect(() => {
    if (variant !== "desktop") return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        clearCloseTimer();
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [variant]);

  const close = () => {
    clearCloseTimer();
    setOpen(false);
    onNavigate?.();
  };

  if (variant === "mobile") {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-text"
          aria-expanded={open}
        >
          Services
          <ChevronDown
            size={16}
            className={`transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        {open ? (
          <div className="ml-2 flex flex-col gap-3 border-l border-border pl-3">
            {serviceGroups.map((group) => (
              <div key={group.id}>
                <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  {group.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {group.links.map((link) => {
                    const href = getServiceHref(group.id, link.slug);
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={close}
                        className={`rounded-lg px-3 py-2 text-sm ${
                          pathname === href
                            ? "font-semibold text-primary"
                            : "text-muted hover:text-text"
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <Link
        href="/services"
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
        className={`inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
          isActive ? "text-text" : "text-muted hover:text-text"
        }`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        Services
        <ChevronDown
          size={15}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </Link>

      {open ? (
        <div
          className="absolute left-1/2 top-full z-[60] w-[min(920px,calc(100vw-2rem))] -translate-x-1/2"
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
        >
          {/* Invisible bridge — keeps hover alive while moving from trigger to panel */}
          <div className="h-4" aria-hidden />

          <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-card shadow-lift">
            <div className="border-b border-border/70 bg-surface/50 px-5 py-3">
              <Link
                href="/services"
                onClick={close}
                className="inline-flex items-center gap-1 text-sm font-bold text-text transition hover:text-primary"
              >
                View all services
                <ChevronDown size={14} className="-rotate-90" aria-hidden />
              </Link>
            </div>
            <div className="grid divide-y divide-border/70 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 lg:divide-x">
              {serviceGroups.map((group) => (
                <div key={group.id} className="px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
                    {group.label}
                  </p>
                  <ul className="mt-3 space-y-1">
                    {group.links.map((link) => {
                      const href = getServiceHref(group.id, link.slug);
                      return (
                        <li key={href}>
                          <Link
                            href={href}
                            onClick={close}
                            className={`block rounded-md px-2 py-1.5 text-sm transition hover:bg-surface ${
                              pathname === href
                                ? "bg-primary/5 font-semibold text-primary"
                                : "text-text"
                            }`}
                          >
                            {link.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
