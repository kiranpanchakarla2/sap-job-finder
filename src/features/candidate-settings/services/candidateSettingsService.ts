/**
 * Candidate Settings Supabase Service (Sprint 6H)
 * Connects Candidate Settings UI to Supabase database.
 * Single source of truth for notifications, job preferences, privacy/talent discovery, and security.
 */

import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types";
import {
  DEFAULT_JOB_PREFERENCES,
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEFAULT_PRIVACY_PREFERENCES,
} from "../data/defaultSettings";
import type {
  CandidateAccountInfo,
  CandidateCareerLevel,
  CandidateEmploymentType,
  CandidateSettings,
  CandidateSettingsServiceResult,
  CandidateWorkMode,
  JobAlertFrequency,
  JobPreferencesSettings,
  NotificationPreferences,
  PrivacyPreferences,
  ProfileVisibilityTier,
  TalentHubVisibilityState,
} from "../types/settings.types";

const WORK_MODE_TO_DB: Record<CandidateWorkMode, string> = {
  Remote: "remote",
  Hybrid: "hybrid",
  "On-site": "onsite",
};

const WORK_MODE_FROM_DB: Record<string, CandidateWorkMode> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
  "on-site": "On-site",
  on_site: "On-site",
  Remote: "Remote",
  Hybrid: "Hybrid",
  "On-site": "On-site",
};

const EMPLOYMENT_TYPE_TO_DB: Record<CandidateEmploymentType, string> = {
  "Full-time": "full_time",
  Contract: "contract",
  "Part-time": "part_time",
};

const EMPLOYMENT_TYPE_FROM_DB: Record<string, CandidateEmploymentType> = {
  full_time: "Full-time",
  contract: "Contract",
  part_time: "Part-time",
  "Full-time": "Full-time",
  Contract: "Contract",
  "Part-time": "Part-time",
};

function logError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[candidateSettingsService] ${context}:`, error);
  }
}

function sanitizeNotificationPreferences(raw: unknown): NotificationPreferences {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  const obj = raw as Record<string, unknown>;
  const frequency: JobAlertFrequency =
    obj.jobAlertFrequency === "immediately" ||
    obj.jobAlertFrequency === "daily" ||
    obj.jobAlertFrequency === "weekly"
      ? obj.jobAlertFrequency
      : DEFAULT_NOTIFICATION_PREFERENCES.jobAlertFrequency;

  return {
    emailNotifications:
      typeof obj.emailNotifications === "boolean"
        ? obj.emailNotifications
        : DEFAULT_NOTIFICATION_PREFERENCES.emailNotifications,
    pushNotifications:
      typeof obj.pushNotifications === "boolean"
        ? obj.pushNotifications
        : DEFAULT_NOTIFICATION_PREFERENCES.pushNotifications,
    jobAlerts:
      typeof obj.jobAlerts === "boolean"
        ? obj.jobAlerts
        : DEFAULT_NOTIFICATION_PREFERENCES.jobAlerts,
    applicationUpdates:
      typeof obj.applicationUpdates === "boolean"
        ? obj.applicationUpdates
        : DEFAULT_NOTIFICATION_PREFERENCES.applicationUpdates,
    recruiterMessages:
      typeof obj.recruiterMessages === "boolean"
        ? obj.recruiterMessages
        : DEFAULT_NOTIFICATION_PREFERENCES.recruiterMessages,
    interviewReminders:
      typeof obj.interviewReminders === "boolean"
        ? obj.interviewReminders
        : DEFAULT_NOTIFICATION_PREFERENCES.interviewReminders,
    platformUpdates:
      typeof obj.platformUpdates === "boolean"
        ? obj.platformUpdates
        : DEFAULT_NOTIFICATION_PREFERENCES.platformUpdates,
    jobAlertFrequency: frequency,
  };
}

function sanitizePrivacyPreferences(raw: unknown): PrivacyPreferences {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_PRIVACY_PREFERENCES };
  }

  const obj = raw as Record<string, unknown>;
  const rawVisibility = obj.talentHubVisibility || obj.profileVisibility;
  let talentHubVisibility: TalentHubVisibilityState = "private";
  if (rawVisibility === "employer_visible" || rawVisibility === "public" || rawVisibility === "limited") {
    talentHubVisibility = "employer_visible";
  } else if (rawVisibility === "open_to_opportunities") {
    talentHubVisibility = "open_to_opportunities";
  } else {
    talentHubVisibility = "private";
  }

  return {
    profileVisibility: talentHubVisibility,
    talentHubVisibility,
    showInTalentSearch:
      typeof obj.showInTalentSearch === "boolean"
        ? obj.showInTalentSearch
        : talentHubVisibility !== "private",
    showResumeToRecruiters:
      typeof obj.showResumeToRecruiters === "boolean"
        ? obj.showResumeToRecruiters
        : DEFAULT_PRIVACY_PREFERENCES.showResumeToRecruiters,
  };
}

function sanitizeJobPreferences(raw: unknown): JobPreferencesSettings {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_JOB_PREFERENCES };
  }

  const obj = raw as Record<string, unknown>;

  const asStringArray = (val: unknown): string[] => {
    if (!Array.isArray(val)) return [];
    return val.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  };

  const workModes = asStringArray(obj.workModes)
    .map((m) => WORK_MODE_FROM_DB[m])
    .filter((m): m is CandidateWorkMode => Boolean(m));

  const employmentTypes = asStringArray(obj.employmentTypes)
    .map((t) => EMPLOYMENT_TYPE_FROM_DB[t])
    .filter((t): t is CandidateEmploymentType => Boolean(t));

  return {
    preferredJobRoles: asStringArray(obj.preferredJobRoles),
    preferredSapModules: asStringArray(obj.preferredSapModules),
    preferredLocations: asStringArray(obj.preferredLocations),
    workModes: workModes.length > 0 ? workModes : DEFAULT_JOB_PREFERENCES.workModes,
    employmentTypes:
      employmentTypes.length > 0 ? employmentTypes : DEFAULT_JOB_PREFERENCES.employmentTypes,
    careerLevel:
      typeof obj.careerLevel === "string"
        ? (obj.careerLevel as CandidateCareerLevel)
        : DEFAULT_JOB_PREFERENCES.careerLevel,
    preferredSalaryRange:
      typeof obj.preferredSalaryRange === "string"
        ? obj.preferredSalaryRange
        : DEFAULT_JOB_PREFERENCES.preferredSalaryRange,
  };
}

async function resolveAuthenticatedCandidate(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { candidateId: null, user: null, error: "Sign in to manage your settings." };
  }

  const { data: candidateId, error: rpcError } = await supabase.rpc("current_candidate_id");

  if (!rpcError && candidateId && typeof candidateId === "string") {
    return { candidateId, user, error: null };
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    logError("resolveCandidateId", profileError);
    return { candidateId: null, user, error: "Unable to verify candidate profile." };
  }

  if (profileRow?.id) {
    return { candidateId: profileRow.id, user, error: null };
  }

  // Create minimal candidate profile if user exists but profile row is missing
  const { data: created, error: insertError } = await supabase
    .from("candidate_profiles")
    .insert({ user_id: user.id })
    .select("id")
    .single();

  if (insertError || !created?.id) {
    logError("ensureCandidateProfile", insertError);
    return { candidateId: null, user, error: "Unable to initialize candidate account." };
  }

  return { candidateId: created.id, user, error: null };
}

export const candidateSettingsService = {
  /**
   * Load complete settings from Supabase.
   */
  async getMySettings(): Promise<CandidateSettingsServiceResult<CandidateSettings>> {
    try {
      const supabase = createClient();
      const { candidateId, user, error: authError } = await resolveAuthenticatedCandidate(supabase);

      if (authError || !candidateId || !user) {
        return {
          success: false,
          error: authError || "Authentication required.",
          code: "UNAUTHENTICATED",
        };
      }

      // Query candidate_settings, profiles, and candidate_profiles in parallel
      const [settingsRes, profileRes, candidateProfileRes] = await Promise.all([
        supabase
          .from("candidate_settings")
          .select("*")
          .eq("candidate_id", candidateId)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("email, phone, first_name, last_name")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("candidate_profiles")
          .select(
            "phone, preferred_job_roles, preferred_sap_modules, preferred_locations, work_modes, employment_types, career_level, preferred_salary_range, is_searchable, discovery_status",
          )
          .eq("id", candidateId)
          .maybeSingle(),
      ]);

      if (settingsRes.error) {
        logError("loadSettings", settingsRes.error);
        return {
          success: false,
          error: "Unable to load your settings. Please try again.",
        };
      }

      const rawSettings = settingsRes.data;
      const profileData = profileRes.data;
      const candidateData = candidateProfileRes.data;

      // 1. Account Info
      const account: CandidateAccountInfo = {
        email: profileData?.email || user.email || "candidate@example.com",
        phone: candidateData?.phone || profileData?.phone || "Not specified",
        accountStatus: "active",
      };

      // 2. Notification Preferences
      const notifications = sanitizeNotificationPreferences(
        rawSettings?.notification_preferences,
      );

      // 3. Job Preferences (Use stored candidate_settings if present, or fallback to candidate_profiles)
      let jobPreferences: JobPreferencesSettings;
      if (rawSettings?.job_preferences) {
        jobPreferences = sanitizeJobPreferences(rawSettings.job_preferences);
      } else if (candidateData) {
        const preferredRoles = Array.isArray(candidateData.preferred_job_roles)
          ? candidateData.preferred_job_roles
          : [];
        const preferredModules = Array.isArray(candidateData.preferred_sap_modules)
          ? candidateData.preferred_sap_modules
          : [];
        const preferredLocs = Array.isArray(candidateData.preferred_locations)
          ? candidateData.preferred_locations
          : [];
        const workModes = (candidateData.work_modes || [])
          .map((m) => WORK_MODE_FROM_DB[m])
          .filter((m): m is CandidateWorkMode => Boolean(m));
        const empTypes = (candidateData.employment_types || [])
          .map((t) => EMPLOYMENT_TYPE_FROM_DB[t])
          .filter((t): t is CandidateEmploymentType => Boolean(t));

        jobPreferences = {
          preferredJobRoles:
            preferredRoles.length > 0
              ? preferredRoles
              : DEFAULT_JOB_PREFERENCES.preferredJobRoles,
          preferredSapModules:
            preferredModules.length > 0
              ? preferredModules
              : DEFAULT_JOB_PREFERENCES.preferredSapModules,
          preferredLocations:
            preferredLocs.length > 0
              ? preferredLocs
              : DEFAULT_JOB_PREFERENCES.preferredLocations,
          workModes:
            workModes.length > 0 ? workModes : DEFAULT_JOB_PREFERENCES.workModes,
          employmentTypes:
            empTypes.length > 0 ? empTypes : DEFAULT_JOB_PREFERENCES.employmentTypes,
          careerLevel:
            (candidateData.career_level as CandidateCareerLevel) ||
            DEFAULT_JOB_PREFERENCES.careerLevel,
          preferredSalaryRange:
            candidateData.preferred_salary_range ||
            DEFAULT_JOB_PREFERENCES.preferredSalaryRange,
        };
      } else {
        jobPreferences = { ...DEFAULT_JOB_PREFERENCES };
      }

      // 4. Privacy Preferences
      let privacy: PrivacyPreferences;
      if (rawSettings?.privacy_preferences) {
        privacy = sanitizePrivacyPreferences(rawSettings.privacy_preferences);
      } else if (candidateData) {
        const isSearchable = Boolean(candidateData.is_searchable);
        privacy = {
          profileVisibility: isSearchable ? "public" : "private",
          showInTalentSearch: isSearchable,
          showResumeToRecruiters: true,
        };
      } else {
        privacy = { ...DEFAULT_PRIVACY_PREFERENCES };
      }

      return {
        success: true,
        data: {
          account,
          notifications,
          jobPreferences,
          privacy,
        },
      };
    } catch (err) {
      logError("getMySettings", err);
      return {
        success: false,
        error: "Unable to load your settings. Please try again.",
      };
    }
  },

  /**
   * Save Notification Preferences to Supabase.
   */
  async saveNotificationPreferences(
    preferences: NotificationPreferences,
  ): Promise<CandidateSettingsServiceResult<NotificationPreferences>> {
    try {
      const supabase = createClient();
      const { candidateId, error: authError } = await resolveAuthenticatedCandidate(supabase);

      if (authError || !candidateId) {
        return {
          success: false,
          error: authError || "Authentication required.",
          code: "UNAUTHENTICATED",
        };
      }

      const sanitized = sanitizeNotificationPreferences(preferences);

      const { error: upsertError } = await supabase
        .from("candidate_settings")
        .upsert(
          {
            candidate_id: candidateId,
            notification_preferences: sanitized as unknown as Json,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "candidate_id" },
        );

      if (upsertError) {
        logError("saveNotificationPreferences", upsertError);
        return {
          success: false,
          error: "Unable to save notification preferences. Please try again.",
        };
      }

      return {
        success: true,
        data: sanitized,
      };
    } catch (err) {
      logError("saveNotificationPreferences", err);
      return {
        success: false,
        error: "Unable to save notification preferences. Please try again.",
      };
    }
  },

  /**
   * Save Job Preferences to Supabase and synchronize with candidate_profiles.
   */
  async saveJobPreferences(
    preferences: JobPreferencesSettings,
  ): Promise<CandidateSettingsServiceResult<JobPreferencesSettings>> {
    try {
      const supabase = createClient();
      const { candidateId, error: authError } = await resolveAuthenticatedCandidate(supabase);

      if (authError || !candidateId) {
        return {
          success: false,
          error: authError || "Authentication required.",
          code: "UNAUTHENTICATED",
        };
      }

      const sanitized = sanitizeJobPreferences(preferences);

      // 1. Upsert candidate_settings
      const { error: settingsError } = await supabase
        .from("candidate_settings")
        .upsert(
          {
            candidate_id: candidateId,
            job_preferences: sanitized as unknown as Json,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "candidate_id" },
        );

      if (settingsError) {
        logError("saveJobPreferences[settings]", settingsError);
        return {
          success: false,
          error: "Unable to save job preferences. Please try again.",
        };
      }

      // 2. Synchronize candidate_profiles table
      const dbWorkModes = sanitized.workModes.map((m) => WORK_MODE_TO_DB[m]);
      const dbEmploymentTypes = sanitized.employmentTypes.map((t) => EMPLOYMENT_TYPE_TO_DB[t]);

      const { error: profileError } = await supabase
        .from("candidate_profiles")
        .update({
          preferred_job_roles: sanitized.preferredJobRoles,
          preferred_sap_modules: sanitized.preferredSapModules,
          preferred_locations: sanitized.preferredLocations,
          work_modes: dbWorkModes,
          employment_types: dbEmploymentTypes,
          career_level: sanitized.careerLevel || null,
          preferred_salary_range: sanitized.preferredSalaryRange || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", candidateId);

      if (profileError) {
        logError("saveJobPreferences[candidate_profiles]", profileError);
        // We log error but don't fail the operation since settings table updated
      }

      return {
        success: true,
        data: sanitized,
      };
    } catch (err) {
      logError("saveJobPreferences", err);
      return {
        success: false,
        error: "Unable to save job preferences. Please try again.",
      };
    }
  },

  /**
   * Save Privacy & Visibility Preferences to Supabase and synchronize candidate_profiles searchability.
   */
  async savePrivacyPreferences(
    preferences: PrivacyPreferences,
  ): Promise<CandidateSettingsServiceResult<PrivacyPreferences>> {
    try {
      const supabase = createClient();
      const { candidateId, error: authError } = await resolveAuthenticatedCandidate(supabase);

      if (authError || !candidateId) {
        return {
          success: false,
          error: authError || "Authentication required.",
          code: "UNAUTHENTICATED",
        };
      }

      const sanitized = sanitizePrivacyPreferences(preferences);

      // 1. Upsert candidate_settings
      const { error: settingsError } = await supabase
        .from("candidate_settings")
        .upsert(
          {
            candidate_id: candidateId,
            privacy_preferences: sanitized as unknown as Json,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "candidate_id" },
        );

      if (settingsError) {
        logError("savePrivacyPreferences[settings]", settingsError);
        return {
          success: false,
          error: "Unable to save privacy settings. Please try again.",
        };
      }

      // 2. Synchronize candidate_profiles visibility/talent search discovery
      const visibilityState = sanitized.talentHubVisibility || sanitized.profileVisibility;
      const isSearchable = visibilityState !== "private" && sanitized.showInTalentSearch;
      const discoveryStatus =
        visibilityState === "private"
          ? "not_available"
          : visibilityState === "open_to_opportunities"
            ? "open_to_opportunities"
            : "available";

      const { error: profileError } = await supabase
        .from("candidate_profiles")
        .update({
          is_searchable: isSearchable,
          discovery_status: discoveryStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", candidateId);

      if (profileError) {
        logError("savePrivacyPreferences[candidate_profiles]", profileError);
      }

      return {
        success: true,
        data: sanitized,
      };
    } catch (err) {
      logError("savePrivacyPreferences", err);
      return {
        success: false,
        error: "Unable to save privacy settings. Please try again.",
      };
    }
  },

  /**
   * Save All candidate settings in one operation.
   */
  async saveAllSettings(input: {
    notifications: NotificationPreferences;
    jobPreferences: JobPreferencesSettings;
    privacy: PrivacyPreferences;
  }): Promise<CandidateSettingsServiceResult<boolean>> {
    try {
      const [notifRes, jobRes, privRes] = await Promise.all([
        this.saveNotificationPreferences(input.notifications),
        this.saveJobPreferences(input.jobPreferences),
        this.savePrivacyPreferences(input.privacy),
      ]);

      if (!notifRes.success || !jobRes.success || !privRes.success) {
        return {
          success: false,
          error: "Some settings could not be saved. Please try again.",
        };
      }

      return { success: true, data: true };
    } catch (err) {
      logError("saveAllSettings", err);
      return {
        success: false,
        error: "Unable to save all settings. Please try again.",
      };
    }
  },

  /**
   * Change password securely via Supabase Auth.
   */
  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<CandidateSettingsServiceResult<boolean>> {
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user?.email) {
        return {
          success: false,
          error: "You must be signed in to change your password.",
          code: "UNAUTHENTICATED",
        };
      }

      if (!currentPassword) {
        return { success: false, error: "Current password is required." };
      }

      if (!newPassword || newPassword.length < 8) {
        return {
          success: false,
          error: "New password must be at least 8 characters long.",
        };
      }

      // Re-authenticate user with current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        return {
          success: false,
          error: "Current password is incorrect.",
        };
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        logError("updateUser password", updateError);
        return {
          success: false,
          error: "Unable to update password. Please ensure it meets complexity requirements.",
        };
      }

      return { success: true, data: true };
    } catch (err) {
      logError("changePassword", err);
      return {
        success: false,
        error: "An unexpected error occurred while updating your password.",
      };
    }
  },

  /**
   * Delete candidate account permanently.
   * Performs clean removal of all candidate data, resumes, applications, and auth user.
   */
  async deleteAccount(): Promise<CandidateSettingsServiceResult<boolean>> {
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return {
          success: false,
          error: "You must be signed in to delete your account.",
          code: "UNAUTHENTICATED",
        };
      }

      // 1. Fetch resume storage paths to clean up from storage bucket
      const { data: resumes } = await supabase
        .from("candidate_resumes")
        .select("storage_path");

      const storagePaths = (resumes || [])
        .map((r: { storage_path?: string | null }) => r.storage_path)
        .filter(Boolean) as string[];

      // 2. Call secure PostgreSQL RPC to delete candidate data and auth user
      const { error: rpcError } = await supabase.rpc("delete_candidate_account");

      if (rpcError) {
        logError("deleteAccount RPC error", rpcError);
        return {
          success: false,
          error: "Failed to delete account. Please try again or contact support.",
        };
      }

      // 3. Clean up storage files if any exist
      if (storagePaths.length > 0) {
        try {
          await supabase.storage.from("resumes").remove(storagePaths);
        } catch (storageErr) {
          logError("deleteAccount storage cleanup", storageErr);
        }
      }

      // 4. Sign out locally
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // Safe to ignore if session is already invalidated by user deletion
      }

      return {
        success: true,
        data: true,
      };
    } catch (err) {
      logError("deleteAccount", err);
      return {
        success: false,
        error: "An unexpected error occurred while deleting your account.",
      };
    }
  },
};

