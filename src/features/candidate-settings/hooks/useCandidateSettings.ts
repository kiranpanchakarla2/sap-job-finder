"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";
import {
  DEFAULT_JOB_PREFERENCES,
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEFAULT_PRIVACY_PREFERENCES,
} from "../data/defaultSettings";
import { candidateSettingsService } from "../services/candidateSettingsService";
import type {
  CandidateAccountInfo,
  JobPreferencesSettings,
  NotificationPreferences,
  PrivacyPreferences,
} from "../types/settings.types";

export function useCandidateSettings() {
  const { user, isLoading: authLoading } = useAuth();

  const [accountInfo, setAccountInfo] = useState<CandidateAccountInfo>({
    email: user?.email || "candidate@example.com",
    phone: "Not specified",
    accountStatus: "active",
  });

  const [savedNotifications, setSavedNotifications] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [draftNotifications, setDraftNotifications] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );

  const [savedJobPreferences, setSavedJobPreferences] = useState<JobPreferencesSettings>(
    DEFAULT_JOB_PREFERENCES,
  );
  const [draftJobPreferences, setDraftJobPreferences] = useState<JobPreferencesSettings>(
    DEFAULT_JOB_PREFERENCES,
  );

  const [savedPrivacy, setSavedPrivacy] = useState<PrivacyPreferences>(
    DEFAULT_PRIVACY_PREFERENCES,
  );
  const [draftPrivacy, setDraftPrivacy] = useState<PrivacyPreferences>(
    DEFAULT_PRIVACY_PREFERENCES,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isSavingJobPreferences, setIsSavingJobPreferences] = useState(false);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);

  // Load settings from Supabase
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const result = await candidateSettingsService.getMySettings();
      if (!result.success) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      const { account, notifications, jobPreferences, privacy } = result.data;

      setAccountInfo(account);
      setSavedNotifications(notifications);
      setDraftNotifications(notifications);

      setSavedJobPreferences(jobPreferences);
      setDraftJobPreferences(jobPreferences);

      setSavedPrivacy(privacy);
      setDraftPrivacy(privacy);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      void loadSettings();
    }
  }, [authLoading, loadSettings]);

  const isNotificationsDirty = useMemo(() => {
    return (
      JSON.stringify(draftNotifications) !== JSON.stringify(savedNotifications)
    );
  }, [draftNotifications, savedNotifications]);

  const isJobPreferencesDirty = useMemo(() => {
    return (
      JSON.stringify(draftJobPreferences) !== JSON.stringify(savedJobPreferences)
    );
  }, [draftJobPreferences, savedJobPreferences]);

  const isPrivacyDirty = useMemo(() => {
    return JSON.stringify(draftPrivacy) !== JSON.stringify(savedPrivacy);
  }, [draftPrivacy, savedPrivacy]);

  const hasUnsavedChanges =
    isNotificationsDirty || isJobPreferencesDirty || isPrivacyDirty;

  const updateNotification = useCallback(
    <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => {
      setDraftNotifications((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const updatePrivacy = useCallback(
    <K extends keyof PrivacyPreferences>(key: K, value: PrivacyPreferences[K]) => {
      setDraftPrivacy((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const setJobPreferences = useCallback(
    (updater: (prev: JobPreferencesSettings) => JobPreferencesSettings) => {
      setDraftJobPreferences(updater);
    },
    [],
  );

  // Save actions to Supabase
  const saveNotifications = useCallback(async () => {
    setIsSavingNotifications(true);
    try {
      const result = await candidateSettingsService.saveNotificationPreferences(draftNotifications);
      if (!result.success) {
        toast.error(result.error || "Unable to save your settings. Please try again.");
        return;
      }
      setSavedNotifications(result.data);
      setDraftNotifications(result.data);
      toast.success("Notification preferences updated successfully.");
    } catch {
      toast.error("Unable to save your settings. Please try again.");
    } finally {
      setIsSavingNotifications(false);
    }
  }, [draftNotifications]);

  const saveJobPreferences = useCallback(async () => {
    setIsSavingJobPreferences(true);
    try {
      const result = await candidateSettingsService.saveJobPreferences(draftJobPreferences);
      if (!result.success) {
        toast.error(result.error || "Unable to save your settings. Please try again.");
        return;
      }
      setSavedJobPreferences(result.data);
      setDraftJobPreferences(result.data);
      toast.success("Job preferences saved successfully.");
    } catch {
      toast.error("Unable to save your settings. Please try again.");
    } finally {
      setIsSavingJobPreferences(false);
    }
  }, [draftJobPreferences]);

  const savePrivacy = useCallback(async () => {
    setIsSavingPrivacy(true);
    try {
      const result = await candidateSettingsService.savePrivacyPreferences(draftPrivacy);
      if (!result.success) {
        toast.error(result.error || "Unable to save your settings. Please try again.");
        return;
      }
      setSavedPrivacy(result.data);
      setDraftPrivacy(result.data);
      toast.success("Privacy settings updated successfully.");
    } catch {
      toast.error("Unable to save your settings. Please try again.");
    } finally {
      setIsSavingPrivacy(false);
    }
  }, [draftPrivacy]);

  const saveAll = useCallback(async () => {
    setIsSavingAll(true);
    try {
      const result = await candidateSettingsService.saveAllSettings({
        notifications: draftNotifications,
        jobPreferences: draftJobPreferences,
        privacy: draftPrivacy,
      });

      if (!result.success) {
        toast.error(result.error || "Unable to save your settings. Please try again.");
        return;
      }

      setSavedNotifications(draftNotifications);
      setSavedJobPreferences(draftJobPreferences);
      setSavedPrivacy(draftPrivacy);
      toast.success("All settings saved successfully.");
    } catch {
      toast.error("Unable to save your settings. Please try again.");
    } finally {
      setIsSavingAll(false);
    }
  }, [draftNotifications, draftJobPreferences, draftPrivacy]);

  // Discard actions
  const discardNotifications = useCallback(() => {
    setDraftNotifications(savedNotifications);
    toast.info("Notification changes discarded.");
  }, [savedNotifications]);

  const discardJobPreferences = useCallback(() => {
    setDraftJobPreferences(savedJobPreferences);
    toast.info("Job preference changes discarded.");
  }, [savedJobPreferences]);

  const discardPrivacy = useCallback(() => {
    setDraftPrivacy(savedPrivacy);
    toast.info("Privacy changes discarded.");
  }, [savedPrivacy]);

  // Reset to defaults
  const resetNotificationsToDefaults = useCallback(() => {
    setDraftNotifications(DEFAULT_NOTIFICATION_PREFERENCES);
    toast.info("Notification preferences reset to defaults (click Save to apply).");
  }, []);

  const resetJobPreferencesToDefaults = useCallback(() => {
    setDraftJobPreferences(DEFAULT_JOB_PREFERENCES);
    toast.info("Job preferences reset to defaults (click Save to apply).");
  }, []);

  const resetPrivacyToDefaults = useCallback(() => {
    setDraftPrivacy(DEFAULT_PRIVACY_PREFERENCES);
    toast.info("Privacy settings reset to defaults (click Save to apply).");
  }, []);

  return {
    accountInfo,
    notifications: draftNotifications,
    jobPreferences: draftJobPreferences,
    privacy: draftPrivacy,
    isNotificationsDirty,
    isJobPreferencesDirty,
    isPrivacyDirty,
    hasUnsavedChanges,
    isSavingNotifications,
    isSavingJobPreferences,
    isSavingPrivacy,
    isSavingAll,
    updateNotification,
    updatePrivacy,
    setJobPreferences,
    saveNotifications,
    saveJobPreferences,
    savePrivacy,
    saveAll,
    discardNotifications,
    discardJobPreferences,
    discardPrivacy,
    resetNotificationsToDefaults,
    resetJobPreferencesToDefaults,
    resetPrivacyToDefaults,
    isLoading: authLoading || isLoading,
    hasError,
    retry: loadSettings,
  };
}
