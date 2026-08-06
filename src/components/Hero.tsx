"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ChevronDown, MapPin, Search } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { HeroVisual } from "@/components/HeroVisual";
import { sapModules, siteConfig, workModeOptions } from "@/lib/constants";

const fieldClass =
  "flex min-w-0 flex-1 items-center gap-2.5 px-4 py-3.5 sm:px-5 sm:py-4";

export function Hero() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [module, setModule] = useState("");
  const [workMode, setWorkMode] = useState("");

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location.trim()) params.set("location", location.trim());
    if (module) params.set("module", module);
    if (workMode) params.set("workMode", workMode);
    router.push(`/jobs${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <section className="relative min-h-[92svh] overflow-hidden pt-20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-hero" />
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{ backgroundImage: "var(--hero-overlay)" }}
      />
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-50" />
      <div className="pointer-events-none absolute -left-24 top-24 h-80 w-80 rounded-full bg-primary/12 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-14">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl lg:max-w-none"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-glass px-3.5 py-1.5 text-xs font-medium text-secondary shadow-soft backdrop-blur-[var(--glass-blur,20px)]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success">
                <Check className="h-3 w-3" aria-hidden />
              </span>
              The SAP career network
            </div>

            <h1 className="text-balance font-heading text-4xl font-bold tracking-tight text-text sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
              {siteConfig.heroHeadline}{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {siteConfig.heroHeadlineAccent}
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
              {siteConfig.heroSubheadline}
            </p>
          </motion.div>

          <HeroVisual />
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 lg:mt-12"
        >
          <form
            onSubmit={onSearch}
            className="w-full overflow-hidden rounded-[var(--radius-card)] border border-border/80 bg-card/95 shadow-lift backdrop-blur-sm"
          >
            <div className="flex flex-col lg:flex-row lg:items-stretch">
              <label className={`${fieldClass} border-b border-border/70 lg:border-b-0 lg:border-r`}>
                <Search size={20} className="shrink-0 text-muted" aria-hidden />
                <span className="sr-only">Search jobs</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Job title, skill, or SAP module"
                  className="w-full min-w-0 bg-transparent text-sm text-text outline-none placeholder:text-muted sm:text-[15px]"
                />
              </label>

              <label className={`${fieldClass} border-b border-border/70 lg:max-w-[180px] lg:border-b-0 lg:border-r xl:max-w-[200px]`}>
                <MapPin size={18} className="shrink-0 text-muted" aria-hidden />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City or remote"
                  className="w-full min-w-0 bg-transparent text-sm text-text outline-none placeholder:text-muted"
                />
              </label>

              <label className={`${fieldClass} relative border-b border-border/70 lg:max-w-[160px] lg:border-b-0 lg:border-r xl:max-w-[180px]`}>
                <span className="sr-only">SAP module</span>
                <select
                  value={module}
                  onChange={(e) => setModule(e.target.value)}
                  className="w-full min-w-0 appearance-none truncate bg-transparent pr-5 text-sm text-text outline-none"
                >
                  <option value="">All modules</option>
                  {sapModules.map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-4 text-muted sm:right-5" />
              </label>

              <label className={`${fieldClass} relative lg:max-w-[150px] lg:border-r lg:border-border/70 xl:max-w-[170px]`}>
                <span className="sr-only">Work mode</span>
                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value)}
                  className="w-full min-w-0 appearance-none truncate bg-transparent pr-5 text-sm text-text outline-none"
                >
                  {workModeOptions.map((option) => (
                    <option key={option.value || "all"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-4 text-muted sm:right-5" />
              </label>

              <Button
                type="submit"
                className="h-auto min-h-[52px] w-full shrink-0 rounded-none px-6 py-4 sm:min-h-[56px] lg:w-auto lg:min-w-[148px]"
              >
                Search
                <ArrowRight size={16} />
              </Button>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            {sapModules.slice(0, 5).map((m) => (
              <button
                key={m.slug}
                type="button"
                onClick={() => router.push(`/jobs?module=${m.slug}`)}
                className="rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-muted shadow-soft transition hover:border-primary/35 hover:text-primary"
              >
                {m.name}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
