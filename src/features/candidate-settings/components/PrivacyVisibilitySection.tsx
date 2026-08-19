"use client";

import {
  Check,
  Eye,
  FileText,
  Info,
  Loader2,
  Lock,
  MessageSquare,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TALENT_HUB_VISIBILITY_OPTIONS } from "../data/defaultSettings";
import type {
  PrivacyPreferences,
  TalentHubVisibilityState,
} from "../types/settings.types";
import { SettingsSection } from "./SettingsSection";
import { SettingsToggle } from "./SettingsToggle";

export function PrivacyVisibilitySection({
  preferences,
  isDirty,
  isSaving,
  onChange,
  onSave,
  onDiscard,
  onReset,
}: {
  preferences: PrivacyPreferences;
  isDirty: boolean;
  isSaving?: boolean;
  onChange: <K extends keyof PrivacyPreferences>(
    key: K,
    value: PrivacyPreferences[K],
  ) => void;
  onSave: () => void;
  onDiscard: () => void;
  onReset: () => void;
}) {
  const currentVisibility: TalentHubVisibilityState =
    preferences.talentHubVisibility ||
    (preferences.profileVisibility === "open_to_opportunities"
      ? "open_to_opportunities"
      : preferences.profileVisibility === "employer_visible" ||
          preferences.profileVisibility === "public" ||
          preferences.profileVisibility === "limited"
        ? "employer_visible"
        : "private");

  const handleVisibilityChange = (state: TalentHubVisibilityState) => {
    onChange("talentHubVisibility", state);
    onChange("profileVisibility", state);
    if (state === "private") {
      onChange("showInTalentSearch", false);
    } else {
      onChange("showInTalentSearch", true);
    }
  };

  return (
    <SettingsSection
      id="privacy"
      title="Talent Hub Visibility & Privacy"
      description="Manage how verified employers discover your SAP profile and access your professional details."
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
        {/* Talent Hub Explanation Banner */}
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs leading-relaxed text-text">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Info size={16} aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-primary">Your Privacy, Your Control</p>
            <p className="mt-0.5 text-muted">
              Talent Hub helps employers discover SAP professionals. You control whether your profile
              appears in Talent Hub and can change your visibility at any time.
            </p>
          </div>
        </div>

        {/* Talent Hub Visibility Choices */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-text">Talent Hub Visibility</h3>
          </div>
          <p className="text-xs text-muted mb-3.5">
            Choose how you want to be discovered by verified employers across the SAP ecosystem.
          </p>

          <div className="space-y-3">
            {TALENT_HUB_VISIBILITY_OPTIONS.map((tier) => {
              const selected = currentVisibility === tier.value;
              return (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => handleVisibilityChange(tier.value)}
                  className={`flex w-full items-start gap-3.5 rounded-xl border p-4 text-left transition-all cursor-pointer ${
                    selected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-soft"
                      : "border-border bg-card hover:border-primary/40 hover:bg-surface/50"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      selected
                        ? "border-primary bg-primary text-white"
                        : "border-muted bg-surface"
                    }`}
                  >
                    {selected ? <Check className="h-3 w-3 stroke-[3]" /> : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text">{tier.label}</span>
                      {tier.badge ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {tier.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted leading-relaxed">
                      {tier.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Granular Field-Level Permissions */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
            Profile-Level Permissions
          </h3>
          <div className="space-y-3">
            <SettingsToggle
              label="Show Resume to Verified Employers"
              description="Allow authenticated employers browsing Talent Hub to view and download your verified resume."
              icon={<FileText className="h-4 w-4 text-primary" />}
              checked={preferences.showResumeToRecruiters}
              onChange={(checked) => onChange("showResumeToRecruiters", checked)}
              disabled={currentVisibility === "private"}
            />

            <SettingsToggle
              label="Appear in Search & Discovery Filters"
              description="Allow employers to filter your profile by SAP modules, experience bands, and locations."
              icon={<Search className="h-4 w-4 text-primary" />}
              checked={preferences.showInTalentSearch}
              onChange={(checked) => onChange("showInTalentSearch", checked)}
              disabled={currentVisibility === "private"}
            />
          </div>
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
                "Save Privacy Settings"
              )}
            </Button>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
