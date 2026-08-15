"use client";

import Link from "next/link";
import {
  Bell,
  Briefcase,
  CalendarCheck,
  Check,
  Clock,
  ExternalLink,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  RotateCcw,
  Sparkles,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { JOB_ALERT_FREQUENCY_OPTIONS } from "../data/defaultSettings";
import type {
  JobAlertFrequency,
  NotificationPreferences,
} from "../types/settings.types";
import { SettingsSection } from "./SettingsSection";
import { SettingsToggle } from "./SettingsToggle";

export function NotificationPreferencesSection({
  preferences,
  isDirty,
  isSaving,
  onChange,
  onSave,
  onDiscard,
  onReset,
}: {
  preferences: NotificationPreferences;
  isDirty: boolean;
  isSaving?: boolean;
  onChange: <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K],
  ) => void;
  onSave: () => void;
  onDiscard: () => void;
  onReset: () => void;
}) {
  return (
    <SettingsSection
      id="notifications"
      title="Notification Preferences"
      description="Choose how and when you receive updates about jobs, applications, and recruiter messages."
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
        {/* Delivery Channels */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
            Delivery Channels
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <SettingsToggle
              label="Email Notifications"
              description="Receive summaries and urgent notices directly to your email."
              icon={<Mail className="h-4 w-4 text-primary" />}
              checked={preferences.emailNotifications}
              onChange={(checked) => onChange("emailNotifications", checked)}
            />
            <SettingsToggle
              label="In-App & Push Notifications"
              description="Receive real-time push alerts on your web browser."
              icon={<Smartphone className="h-4 w-4 text-primary" />}
              checked={preferences.pushNotifications}
              onChange={(checked) => onChange("pushNotifications", checked)}
            />
          </div>
        </div>

        {/* Activity & Alert Categories */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
            Activity & Event Alerts
          </h3>
          <div className="space-y-3">
            <SettingsToggle
              label="Job Alerts"
              description="Receive notifications when newly posted SAP jobs match your preferred modules and filters."
              icon={<Briefcase className="h-4 w-4 text-primary" />}
              checked={preferences.jobAlerts}
              onChange={(checked) => onChange("jobAlerts", checked)}
            />

            <SettingsToggle
              label="Application Updates"
              description="Instant alerts when your submitted application status changes (e.g. Under Review, Shortlisted)."
              icon={<Inbox className="h-4 w-4 text-primary" />}
              checked={preferences.applicationUpdates}
              onChange={(checked) => onChange("applicationUpdates", checked)}
            />

            <SettingsToggle
              label="Recruiter Messages"
              description="Notifications when SAP hiring managers or recruiters send you direct chat messages."
              icon={<MessageSquare className="h-4 w-4 text-primary" />}
              checked={preferences.recruiterMessages}
              onChange={(checked) => onChange("recruiterMessages", checked)}
            />

            <SettingsToggle
              label="Interview Reminders"
              description="Timely calendar alerts for upcoming technical rounds and scheduled video calls."
              icon={<CalendarCheck className="h-4 w-4 text-primary" />}
              checked={preferences.interviewReminders}
              onChange={(checked) => onChange("interviewReminders", checked)}
            />

            <SettingsToggle
              label="Platform & Feature Updates"
              description="Occasional updates regarding new platform capabilities, SAP hiring trends, and career advice."
              icon={<Sparkles className="h-4 w-4 text-primary" />}
              checked={preferences.platformUpdates}
              onChange={(checked) => onChange("platformUpdates", checked)}
            />
          </div>
        </div>

        {/* Job Alert Frequency */}
        <div className="rounded-xl border border-border/80 bg-surface/30 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-text">Job Alert Delivery Frequency</h3>
          </div>
          <p className="text-xs text-muted mb-4">
            Control how frequently job alert summary notifications are delivered.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {JOB_ALERT_FREQUENCY_OPTIONS.map((option) => {
              const selected = preferences.jobAlertFrequency === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange("jobAlertFrequency", option.value)}
                  className={`flex flex-col text-left rounded-xl border p-3.5 transition-all cursor-pointer ${
                    selected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border bg-card hover:border-primary/40 hover:bg-surface/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-text">{option.label}</span>
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                        selected
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-surface"
                      }`}
                    >
                      {selected ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : null}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Info Box: Notifications page link */}
        <div className="flex items-center justify-between rounded-xl border border-border/80 bg-surface/40 px-4 py-3 text-xs text-muted">
          <span>Looking to view received notification history?</span>
          <Link
            href="/candidate/notifications"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            <span>View Notifications</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
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
                "Save Preferences"
              )}
            </Button>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
