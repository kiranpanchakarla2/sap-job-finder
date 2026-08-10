"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { AuthActions } from "@/components/nav/AuthActions";
import { DesktopNavigation } from "@/components/nav/DesktopNavigation";
import { MobileNavigation } from "@/components/nav/MobileNavigation";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-[var(--motion-transition-ms,220ms)] ${
        scrolled || mobileOpen
          ? "border-b border-border/70 bg-navbar shadow-[0_1px_0_color-mix(in_srgb,var(--text)_4%,transparent)] backdrop-blur-[var(--glass-blur,20px)]"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-5 lg:gap-6 sm:px-8">
        <BrandLogo onClick={() => setMobileOpen(false)} />

        <DesktopNavigation />

        <AuthActions />

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 md:hidden"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <MobileNavigation open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </motion.header>
  );
}
