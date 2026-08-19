"use client";

import { Check, Filter, RotateCcw, X } from "lucide-react";
import type {
  PublicExperienceBand,
  PublicTalentSearchFilters,
  PublicWorkMode,
} from "../types/publicTalent.types";

const ROLE_CATEGORIES = [
  { label: "All Roles", value: "" },
  { label: "SAP Consultants", value: "consultant" },
  { label: "SAP Developers", value: "developer" },
  { label: "SAP Architects", value: "architect" },
  { label: "Functional Specialists", value: "functional" },
  { label: "Technical Specialists", value: "technical" },
  { label: "Project & Program Leads", value: "program-lead" },
];

const SAP_MODULES = [
  "SAP FICO",
  "SAP MM",
  "SAP SD",
  "SAP ABAP",
  "SAP BTP",
  "SAP S/4HANA",
  "SAP SuccessFactors",
  "SAP Basis",
  "SAP PP",
  "SAP EWM",
  "SAP Integration Suite",
  "SAP Security",
];

const EXPERIENCE_BANDS: { label: string; value: PublicExperienceBand }[] = [
  { label: "0–2 Years (Junior)", value: "0-2" },
  { label: "3–5 Years (Mid-Level)", value: "3-5" },
  { label: "6–8 Years (Senior)", value: "6-8" },
  { label: "9–12 Years (Lead)", value: "9-12" },
  { label: "13+ Years (Principal/Architect)", value: "13+" },
];

const WORK_MODES: { label: string; value: PublicWorkMode }[] = [
  { label: "Remote", value: "remote" },
  { label: "Hybrid", value: "hybrid" },
  { label: "On-site", value: "onsite" },
];

const LOCATIONS = [
  "Hyderabad",
  "Bangalore",
  "Pune",
  "Mumbai",
  "Chennai",
  "Gurgaon",
  "Noida",
];

type PublicTalentFiltersProps = {
  filters: PublicTalentSearchFilters;
  onChange: (updated: Partial<PublicTalentSearchFilters>) => void;
  onReset: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
};

export function PublicTalentFilters({
  filters,
  onChange,
  onReset,
  isMobileOpen = false,
  onCloseMobile,
}: PublicTalentFiltersProps) {
  const toggleModule = (mod: string) => {
    const next = filters.modules.includes(mod)
      ? filters.modules.filter((m) => m !== mod)
      : [...filters.modules, mod];
    onChange({ modules: next });
  };

  const toggleBand = (band: PublicExperienceBand) => {
    const next = filters.experienceBands.includes(band)
      ? filters.experienceBands.filter((b) => b !== band)
      : [...filters.experienceBands, band];
    onChange({ experienceBands: next });
  };

  const toggleWorkMode = (mode: PublicWorkMode) => {
    const next = filters.workModes.includes(mode)
      ? filters.workModes.filter((m) => m !== mode)
      : [...filters.workModes, mode];
    onChange({ workModes: next });
  };

  const toggleLocation = (loc: string) => {
    const next = filters.locations.includes(loc)
      ? filters.locations.filter((l) => l !== loc)
      : [...filters.locations, loc];
    onChange({ locations: next });
  };

  const hasActiveFilters =
    Boolean(filters.type) ||
    filters.modules.length > 0 ||
    filters.experienceBands.length > 0 ||
    filters.workModes.length > 0 ||
    filters.locations.length > 0 ||
    Boolean(filters.keyword);

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/70 pb-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-primary" aria-hidden="true" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-text">Filters</h2>
        </div>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-accent focus-visible:outline-none"
          >
            <RotateCcw size={12} aria-hidden="true" />
            <span>Reset</span>
          </button>
        ) : null}
      </div>

      {/* Role Category */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-muted">
          Role Category
        </label>
        <div className="mt-2.5 space-y-1">
          {ROLE_CATEGORIES.map((cat) => {
            const selected = (filters.type || "") === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => onChange({ type: cat.value || null })}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-xs transition ${
                  selected
                    ? "bg-primary/10 font-bold text-primary"
                    : "text-muted hover:bg-surface hover:text-text"
                }`}
              >
                <span>{cat.label}</span>
                {selected ? <Check size={14} className="text-primary" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* SAP Modules Filter */}
      <div className="border-t border-border/60 pt-5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted">
          SAP Modules
        </label>
        <div className="mt-2.5 max-h-48 space-y-1.5 overflow-y-auto pr-1">
          {SAP_MODULES.map((mod) => {
            const checked = filters.modules.includes(mod);
            return (
              <label
                key={mod}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1 text-xs text-text hover:bg-surface"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleModule(mod)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                />
                <span className={checked ? "font-semibold text-primary" : "text-muted"}>
                  {mod}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Experience Bands */}
      <div className="border-t border-border/60 pt-5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted">
          Experience Level
        </label>
        <div className="mt-2.5 space-y-1.5">
          {EXPERIENCE_BANDS.map((band) => {
            const checked = filters.experienceBands.includes(band.value);
            return (
              <label
                key={band.value}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1 text-xs text-text hover:bg-surface"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleBand(band.value)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                />
                <span className={checked ? "font-semibold text-primary" : "text-muted"}>
                  {band.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Work Modes */}
      <div className="border-t border-border/60 pt-5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted">
          Work Arrangement
        </label>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {WORK_MODES.map((mode) => {
            const checked = filters.workModes.includes(mode.value);
            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => toggleWorkMode(mode.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  checked
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-card text-muted hover:border-primary/40 hover:text-text"
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Location */}
      <div className="border-t border-border/60 pt-5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted">
          Location (India Hubs)
        </label>
        <div className="mt-2.5 space-y-1.5">
          {LOCATIONS.map((loc) => {
            const checked = filters.locations.includes(loc);
            return (
              <label
                key={loc}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1 text-xs text-text hover:bg-surface"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleLocation(loc)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                />
                <span className={checked ? "font-semibold text-primary" : "text-muted"}>
                  {loc}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar Panel */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-24 rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
          {content}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex lg:hidden"
        >
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative ml-auto flex h-full w-full max-w-xs flex-col bg-card p-5 shadow-lift overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-sm font-bold text-text">Filter Talent</h3>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1 rounded-lg text-muted hover:bg-surface hover:text-text"
              >
                <X size={18} />
              </button>
            </div>
            {content}
            <div className="mt-6 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onCloseMobile}
                className="w-full rounded-[var(--radius-button)] bg-primary py-2.5 text-xs font-semibold text-white shadow-xs"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
