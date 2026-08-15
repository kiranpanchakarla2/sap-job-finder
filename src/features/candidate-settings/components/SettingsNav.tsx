"use client";

import {
  AlertTriangle,
  Bell,
  Briefcase,
  CreditCard,
  Lock,
  Shield,
  User,
  type LucideIcon,
} from "lucide-react";
import { SETTINGS_NAV_ITEMS } from "../data/defaultSettings";
import type { SettingsSectionId } from "../types/settings.types";

const ICON_MAP: Record<string, LucideIcon> = {
  User,
  Bell,
  Briefcase,
  Shield,
  Lock,
  CreditCard,
  AlertTriangle,
};

export function SettingsNav({
  activeSection,
  onSectionClick,
}: {
  activeSection: SettingsSectionId;
  onSectionClick: (id: SettingsSectionId) => void;
}) {
  return (
    <>
      {/* Mobile/Tablet Horizontal Tabs */}
      <div className="lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {SETTINGS_NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.iconName] || User;
            const isActive = activeSection === item.id;
            const isDanger = item.id === "danger-zone";

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSectionClick(item.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? isDanger
                      ? "bg-error text-white shadow-soft"
                      : "bg-primary text-white shadow-soft"
                    : isDanger
                      ? "border border-error/20 bg-error/5 text-error hover:bg-error/10"
                      : "border border-border bg-card text-muted hover:border-primary/40 hover:bg-surface/60 hover:text-text"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Vertical Nav */}
      <nav
        aria-label="Settings sections"
        className="hidden lg:sticky lg:top-20 lg:flex lg:flex-col lg:gap-1.5"
      >
        <div className="rounded-[var(--radius-card)] border border-border bg-card p-2 shadow-soft">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Preferences & Security
          </p>
          <div className="space-y-1">
            {SETTINGS_NAV_ITEMS.map((item) => {
              const Icon = ICON_MAP[item.iconName] || User;
              const isActive = activeSection === item.id;
              const isDanger = item.id === "danger-zone";

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSectionClick(item.id)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
                    isActive
                      ? isDanger
                        ? "bg-error/10 text-error ring-1 ring-error/30"
                        : "bg-primary/10 text-primary ring-1 ring-primary/30"
                      : isDanger
                        ? "text-error/80 hover:bg-error/5 hover:text-error"
                        : "text-muted hover:bg-surface hover:text-text"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      isActive
                        ? isDanger
                          ? "bg-error text-white"
                          : "bg-primary text-white"
                        : isDanger
                          ? "bg-error/10 text-error"
                          : "bg-surface text-muted group-hover:text-text"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.label}</p>
                    {item.description ? (
                      <p className="truncate text-xs text-muted/80">{item.description}</p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
