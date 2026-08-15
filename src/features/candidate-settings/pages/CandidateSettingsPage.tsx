"use client";

import { useEffect, useState } from "react";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { Skeleton, SkeletonCard } from "@/components/dashboard/shared/Skeleton";
import { AccountSection } from "../components/AccountSection";
import { DangerZoneSection } from "../components/DangerZoneSection";
import { JobPreferencesSection } from "../components/JobPreferencesSection";
import { NotificationPreferencesSection } from "../components/NotificationPreferencesSection";
import { PrivacyVisibilitySection } from "../components/PrivacyVisibilitySection";
import { SecuritySection } from "../components/SecuritySection";
import { SettingsNav } from "../components/SettingsNav";
import { SubscriptionSection } from "../components/SubscriptionSection";
import { useCandidateSettings } from "../hooks/useCandidateSettings";
import type { SettingsSectionId } from "../types/settings.types";

export function CandidateSettingsPage() {
  const {
    accountInfo,
    notifications,
    jobPreferences,
    privacy,
    isNotificationsDirty,
    isJobPreferencesDirty,
    isPrivacyDirty,
    isSavingNotifications,
    isSavingJobPreferences,
    isSavingPrivacy,
    updateNotification,
    updatePrivacy,
    setJobPreferences,
    saveNotifications,
    saveJobPreferences,
    savePrivacy,
    discardNotifications,
    discardJobPreferences,
    discardPrivacy,
    resetNotificationsToDefaults,
    resetJobPreferencesToDefaults,
    resetPrivacyToDefaults,
    isLoading,
    hasError,
    retry,
  } = useCandidateSettings();

  const [activeSection, setActiveSection] = useState<SettingsSectionId>("account");

  // Scroll to section handler
  const handleSectionClick = (id: SettingsSectionId) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Scrollspy via IntersectionObserver
  useEffect(() => {
    const sectionIds: SettingsSectionId[] = [
      "account",
      "notifications",
      "job-preferences",
      "privacy",
      "security",
      "subscription",
      "danger-zone",
    ];

    const observers: IntersectionObserver[] = [];

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id as SettingsSectionId);
        }
      });
    };

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        const observer = new IntersectionObserver(observerCallback, {
          root: null,
          rootMargin: "-20% 0px -60% 0px",
          threshold: 0,
        });
        observer.observe(el);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <div className="space-y-3 hidden lg:block">
            <SkeletonCard className="h-64" />
          </div>
          <div className="space-y-6">
            <SkeletonCard className="h-48" />
            <SkeletonCard className="h-64" />
            <SkeletonCard className="h-56" />
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="mx-auto max-w-4xl py-12">
        <ErrorState
          title="Unable to load settings"
          description="An error occurred while loading your account preferences. Please try again."
          onRetry={retry}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted">
          Manage your account, preferences, notifications, privacy and security.
        </p>
      </div>

      {/* Main Grid: Left Nav + Right Content */}
      <div className="grid gap-6 lg:grid-cols-[240px_1fr] items-start">
        {/* Navigation Sidebar (Desktop sticky / Mobile tabs) */}
        <SettingsNav
          activeSection={activeSection}
          onSectionClick={handleSectionClick}
        />

        {/* Content Sections */}
        <div className="min-w-0 space-y-6">
          {/* 1. Account Section */}
          <AccountSection account={accountInfo} />

          {/* 2. Notification Preferences */}
          <NotificationPreferencesSection
            preferences={notifications}
            isDirty={isNotificationsDirty}
            isSaving={isSavingNotifications}
            onChange={updateNotification}
            onSave={saveNotifications}
            onDiscard={discardNotifications}
            onReset={resetNotificationsToDefaults}
          />

          {/* 3. Job Preferences */}
          <JobPreferencesSection
            preferences={jobPreferences}
            isDirty={isJobPreferencesDirty}
            isSaving={isSavingJobPreferences}
            onChange={setJobPreferences}
            onSave={saveJobPreferences}
            onDiscard={discardJobPreferences}
            onReset={resetJobPreferencesToDefaults}
          />

          {/* 4. Privacy & Visibility */}
          <PrivacyVisibilitySection
            preferences={privacy}
            isDirty={isPrivacyDirty}
            isSaving={isSavingPrivacy}
            onChange={updatePrivacy}
            onSave={savePrivacy}
            onDiscard={discardPrivacy}
            onReset={resetPrivacyToDefaults}
          />

          {/* 5. Security */}
          <SecuritySection />

          {/* 6. Subscription */}
          <SubscriptionSection />

          {/* 7. Danger Zone */}
          <DangerZoneSection />
        </div>
      </div>
    </div>
  );
}
