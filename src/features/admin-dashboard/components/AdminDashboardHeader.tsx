"use client";

/**
 * AdminDashboardHeader Component
 * Header with Page Title, Date Range Filter Selector (with custom modal), and Refresh action.
 */

import { useState } from "react";
import {
  Calendar,
  CalendarRange,
  ChevronDown,
  RefreshCw,
  X,
} from "lucide-react";
import type {
  DateRangeFilter,
  DateRangeOption,
} from "../types/dashboard.types";

type AdminDashboardHeaderProps = {
  dateRange: DateRangeFilter;
  onDateRangeChange: (
    option: DateRangeOption,
    customStart?: string,
    customEnd?: string,
  ) => void;
  onRefresh: () => void;
  refreshing?: boolean;
};

const DATE_OPTIONS: { value: DateRangeOption; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "custom", label: "Custom Range..." },
];

export function AdminDashboardHeader({
  dateRange,
  onDateRangeChange,
  onRefresh,
  refreshing = false,
}: AdminDashboardHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const handleSelectOption = (opt: DateRangeOption) => {
    setDropdownOpen(false);
    if (opt === "custom") {
      setShowCustomModal(true);
    } else {
      onDateRangeChange(opt);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    onDateRangeChange("custom", customStart, customEnd);
    setShowCustomModal(false);
  };

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Dashboard
          </h1>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary border border-primary/20">
            Super Admin
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          Platform overview and operational activity
        </p>
      </div>

      {/* Actions: Date Filter & Refresh */}
      <div className="flex items-center gap-3">
        {/* Date Range Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
            className="flex items-center gap-2 rounded-[var(--radius-button)] border border-border bg-card px-3.5 py-2 text-xs font-medium text-text shadow-soft transition hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <Calendar size={15} className="text-primary" />
            <span>{dateRange.label}</span>
            <ChevronDown
              size={14}
              className={`text-muted transition-transform duration-150 ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {dropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-20"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 z-30 mt-1.5 w-48 rounded-[var(--radius-card)] border border-border bg-card py-1 shadow-card animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted border-b border-border">
                  Select Period
                </div>
                {DATE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelectOption(opt.value)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium transition ${
                      dateRange.option === opt.value
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-text hover:bg-surface"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {dateRange.option === opt.value && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh Dashboard Data"
          className="flex items-center gap-2 rounded-[var(--radius-button)] border border-border bg-card px-3.5 py-2 text-xs font-medium text-text shadow-soft transition hover:border-primary/40 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
        >
          <RefreshCw
            size={14}
            className={`text-muted transition ${
              refreshing ? "animate-spin text-primary" : "hover:text-primary"
            }`}
          />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Custom Date Range Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <CalendarRange size={18} className="text-primary" />
                <h3 className="text-base font-semibold text-text">
                  Custom Date Range
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="rounded-lg p-1 text-muted hover:bg-surface hover:text-text"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleApplyCustom} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full rounded-[var(--radius-button)] border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full rounded-[var(--radius-button)] border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="rounded-[var(--radius-button)] border border-border px-4 py-2 text-xs font-medium text-muted hover:bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-[var(--radius-button)] bg-primary px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-primary/90"
                >
                  Apply Range
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
