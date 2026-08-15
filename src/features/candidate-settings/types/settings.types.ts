/**
 * TypeScript types for Candidate Settings (Sprint 6G)
 */

export type JobAlertFrequency = "immediately" | "daily" | "weekly";

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  jobAlerts: boolean;
  applicationUpdates: boolean;
  recruiterMessages: boolean;
  interviewReminders: boolean;
  platformUpdates: boolean;
  jobAlertFrequency: JobAlertFrequency;
}

export type ProfileVisibilityTier = "public" | "limited" | "private";

export interface PrivacyPreferences {
  profileVisibility: ProfileVisibilityTier;
  showInTalentSearch: boolean;
  showResumeToRecruiters: boolean;
}

export type CandidateWorkMode = "Remote" | "Hybrid" | "On-site";
export type CandidateEmploymentType = "Full-time" | "Contract" | "Part-time";
export type CandidateCareerLevel =
  | "Entry Level"
  | "Mid Level"
  | "Senior"
  | "Lead"
  | "Manager"
  | "";

export interface JobPreferencesSettings {
  preferredJobRoles: string[];
  preferredSapModules: string[];
  preferredLocations: string[];
  workModes: CandidateWorkMode[];
  employmentTypes: CandidateEmploymentType[];
  careerLevel: CandidateCareerLevel;
  preferredSalaryRange: string;
}

export interface CandidateAccountInfo {
  email: string;
  phone: string;
  accountStatus: "active" | "pending" | "suspended";
}

export interface CandidateSettings {
  account: CandidateAccountInfo;
  notifications: NotificationPreferences;
  jobPreferences: JobPreferencesSettings;
  privacy: PrivacyPreferences;
}

export type SettingsSectionId =
  | "account"
  | "notifications"
  | "job-preferences"
  | "privacy"
  | "security"
  | "subscription"
  | "danger-zone";

export interface SettingsNavItem {
  id: SettingsSectionId;
  label: string;
  description?: string;
  iconName: string;
}

export type CandidateSettingsServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };
