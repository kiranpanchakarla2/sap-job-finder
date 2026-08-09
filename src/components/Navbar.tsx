"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { ServicesNav } from "@/components/nav/ServicesNav";
import { publicNavLinks } from "@/lib/constants";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 h-20 transition-all duration-[var(--motion-transition-ms,220ms)] ${
        scrolled
          ? "border-b border-border/70 bg-navbar shadow-[0_1px_0_color-mix(in_srgb,var(--text)_4%,transparent)] backdrop-blur-[var(--glass-blur,20px)]"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <BrandLogo onClick={() => setOpen(false)} />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {publicNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              {link.label}
            </Link>
          ))}
          <ServicesNav />
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button href="/login" variant="ghost" className="px-4 py-2.5">
            Sign in
          </Button>
          <Button href="/register" className="px-4 py-2.5">
            Create profile
            <ArrowRight size={16} />
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-text md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="border-b border-border bg-card px-5 py-4 shadow-soft md:hidden"
          >
            <nav className="flex flex-col gap-1">
              {publicNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-text"
                >
                  {link.label}
                </Link>
              ))}
              <ServicesNav variant="mobile" onNavigate={() => setOpen(false)} />
            </nav>
            <div className="mt-4 flex flex-col gap-2">
              <Button href="/login" variant="secondary" onClick={() => setOpen(false)}>
                Sign in
              </Button>
              <Button href="/register" onClick={() => setOpen(false)}>
                Create profile
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
