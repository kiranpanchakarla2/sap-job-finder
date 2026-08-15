"use client";

import { useState, type KeyboardEvent } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  Check,
  Loader2,
  MapPin,
  Plus,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  CAREER_LEVEL_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  SAP_MODULE_OPTIONS,
  WORK_MODE_OPTIONS,
} from "../data/defaultSettings";
import type {
  CandidateCareerLevel,
  CandidateEmploymentType,
  CandidateWorkMode,
  JobPreferencesSettings,
} from "../types/settings.types";
import { SettingsSection } from "./SettingsSection";

function toggleItem<T extends string>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export function JobPreferencesSection({
  preferences,
  isDirty,
  isSaving,
  onChange,
  onSave,
  onDiscard,
  onReset,
}: {
  preferences: JobPreferencesSettings;
  isDirty: boolean;
  isSaving?: boolean;
  onChange: (updater: (prev: JobPreferencesSettings) => JobPreferencesSettings) => void;
  onSave: () => void;
  onDiscard: () => void;
  onReset: () => void;
}) {
  const [newLocationInput, setNewLocationInput] = useState("");
  const [newRoleInput, setNewRoleInput] = useState("");

  const addLocation = (loc: string) => {
    const trimmed = loc.trim();
    if (trimmed && !preferences.preferredLocations.includes(trimmed)) {
      onChange((prev) => ({
        ...prev,
        preferredLocations: [...prev.preferredLocations, trimmed],
      }));
      setNewLocationInput("");
    }
  };

  const removeLocation = (loc: string) => {
    onChange((prev) => ({
      ...prev,
      preferredLocations: prev.preferredLocations.filter((x) => x !== loc),
    }));
  };

  const addRole = (role: string) => {
    const trimmed = role.trim();
    if (trimmed && !preferences.preferredJobRoles.includes(trimmed)) {
      onChange((prev) => ({
        ...prev,
        preferredJobRoles: [...prev.preferredJobRoles, trimmed],
      }));
      setNewRoleInput("");
    }
  };

  const removeRole = (role: string) => {
    onChange((prev) => ({
      ...prev,
      preferredJobRoles: prev.preferredJobRoles.filter((x) => x !== role),
    }));
  };

  return (
    <SettingsSection
      id="job-preferences"
      title="Job Preferences"
      description="Tailor your target SAP positions, work modes, and compensation expectations to improve job recommendations."
      headerAction={
        <div className="flex items-center gap-2">
          {isDirty ? (
            <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              Unsaved changes
            </span>
          ) : null}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Preferred Work Modes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">
            Work Mode
          </label>
          <div className="flex flex-wrap gap-2.5">
            {WORK_MODE_OPTIONS.map((mode) => {
              const selected = preferences.workModes.includes(mode);
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() =>
                    onChange((prev) => ({
                      ...prev,
                      workModes: toggleItem(prev.workModes, mode),
                    }))
                  }
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all cursor-pointer ${
                    selected
                      ? "border border-primary bg-primary text-white shadow-soft"
                      : "border border-border bg-surface/40 text-text hover:border-primary/40 hover:bg-surface"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      selected ? "border-white bg-white text-primary" : "border-muted"
                    }`}
                  >
                    {selected ? <Check className="h-3 w-3 stroke-[3]" /> : null}
                  </span>
                  <span>{mode}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preferred Employment Types */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">
            Employment Type
          </label>
          <div className="flex flex-wrap gap-2.5">
            {EMPLOYMENT_TYPE_OPTIONS.map((type) => {
              const selected = preferences.employmentTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    onChange((prev) => ({
                      ...prev,
                      employmentTypes: toggleItem(prev.employmentTypes, type),
                    }))
                  }
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all cursor-pointer ${
                    selected
                      ? "border border-primary bg-primary text-white shadow-soft"
                      : "border border-border bg-surface/40 text-text hover:border-primary/40 hover:bg-surface"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      selected ? "border-white bg-white text-primary" : "border-muted"
                    }`}
                  >
                    {selected ? <Check className="h-3 w-3 stroke-[3]" /> : null}
                  </span>
                  <span>{type}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preferred Career Level */}
        <div>
          <label
            htmlFor="career-level-select"
            className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2.5"
          >
            Target Career Level
          </label>
          <div className="relative max-w-sm">
            <select
              id="career-level-select"
              value={preferences.careerLevel}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  careerLevel: e.target.value as CandidateCareerLevel,
                }))
              }
              className="w-full appearance-none rounded-[var(--radius-control)] border border-border bg-input px-3.5 py-2.5 text-sm text-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              <option value="">Select Target Level</option>
              {CAREER_LEVEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted">
              <span className="text-xs">▼</span>
            </div>
          </div>
        </div>

        {/* Preferred SAP Modules */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
              Preferred SAP Modules & Ecosystems
            </label>
            <span className="text-xs text-muted">
              {preferences.preferredSapModules.length} selected
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAP_MODULE_OPTIONS.map((module) => {
              const selected = preferences.preferredSapModules.includes(module);
              return (
                <button
                  key={module}
                  type="button"
                  onClick={() =>
                    onChange((prev) => ({
                      ...prev,
                      preferredSapModules: toggleItem(prev.preferredSapModules, module),
                    }))
                  }
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                    selected
                      ? "border border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                      : "border border-border bg-surface/30 text-muted hover:border-border hover:bg-surface/70 hover:text-text"
                  }`}
                >
                  {selected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  <span>{module}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preferred Target Locations */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">
            Preferred Locations
          </label>
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            {preferences.preferredLocations.map((loc) => (
              <span
                key={loc}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-text"
              >
                <MapPin className="h-3 w-3 text-primary" />
                <span>{loc}</span>
                <button
                  type="button"
                  aria-label={`Remove location ${loc}`}
                  onClick={() => removeLocation(loc)}
                  className="rounded p-0.5 text-muted hover:bg-primary/10 hover:text-primary"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              value={newLocationInput}
              onChange={(e) => setNewLocationInput(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addLocation(newLocationInput);
                }
              }}
              placeholder="e.g. Bangalore, Hyderabad, Pune..."
              className="flex-1 rounded-[var(--radius-control)] border border-border bg-input px-3 py-2 text-xs text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => addLocation(newLocationInput)}
              disabled={!newLocationInput.trim()}
              className="px-3 py-1.5 text-xs"
            >
              Add Location
            </Button>
          </div>
        </div>

        {/* Preferred Target Job Roles */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2.5">
            Target Job Roles
          </label>
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            {preferences.preferredJobRoles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface/60 px-3 py-1 text-xs font-medium text-text"
              >
                <Briefcase className="h-3 w-3 text-primary" />
                <span>{role}</span>
                <button
                  type="button"
                  aria-label={`Remove role ${role}`}
                  onClick={() => removeRole(role)}
                  className="rounded p-0.5 text-muted hover:bg-surface hover:text-text"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              value={newRoleInput}
              onChange={(e) => setNewRoleInput(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addRole(newRoleInput);
                }
              }}
              placeholder="e.g. SAP ABAP Consultant, BTP Architect..."
              className="flex-1 rounded-[var(--radius-control)] border border-border bg-input px-3 py-2 text-xs text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => addRole(newRoleInput)}
              disabled={!newRoleInput.trim()}
              className="px-3 py-1.5 text-xs"
            >
              Add Role
            </Button>
          </div>
        </div>

        {/* Full Profile / Job Search Shortcut */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-border/80 bg-surface/40 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text">Comprehensive Profile Preferences</p>
              <p className="text-xs text-muted">
                Edit salary expectations, notice period, and detailed module experience in your profile.
              </p>
            </div>
          </div>
          <Button href="/candidate/profile" variant="secondary" className="shrink-0 px-3.5 py-1.5 text-xs">
            <span>Edit Profile</span>
            <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/60">
          <Button
            type="button"
            variant="ghost"
            onClick={onReset}
            className="text-xs text-muted hover:text-text px-3 py-1.5"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset to Defaults
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isDirty ? (
              <Button
                type="button"
                variant="secondary"
                disabled={isSaving}
                onClick={onDiscard}
                className="flex-1 sm:flex-none px-4 py-2 text-xs"
              >
                Discard
              </Button>
            ) : null}
            <Button
              type="button"
              variant="primary"
              disabled={!isDirty || isSaving}
              onClick={onSave}
              className="flex-1 sm:flex-none px-4 py-2 text-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Job Preferences"
              )}
            </Button>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
