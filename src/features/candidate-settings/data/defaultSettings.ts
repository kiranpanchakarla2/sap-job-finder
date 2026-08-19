import type {
  CandidateCareerLevel,
  CandidateEmploymentType,
  CandidateWorkMode,
  JobAlertFrequency,
  JobPreferencesSettings,
  NotificationPreferences,
  PrivacyPreferences,
  ProfileVisibilityTier,
  SettingsNavItem,
  TalentHubVisibilityState,
} from "../types/settings.types";

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  jobAlerts: true,
  applicationUpdates: true,
  recruiterMessages: true,
  interviewReminders: true,
  platformUpdates: false,
  jobAlertFrequency: "daily",
};

export const DEFAULT_PRIVACY_PREFERENCES: PrivacyPreferences = {
  profileVisibility: "private",
  talentHubVisibility: "private",
  showInTalentSearch: false,
  showResumeToRecruiters: true,
};

export const DEFAULT_JOB_PREFERENCES: JobPreferencesSettings = {
  preferredJobRoles: ["SAP UI5 Developer", "SAP Fiori Consultant"],
  preferredSapModules: ["SAP UI5", "SAP Fiori", "SAP BTP"],
  preferredLocations: ["Bangalore", "Hyderabad", "Remote"],
  workModes: ["Hybrid", "Remote"],
  employmentTypes: ["Full-time"],
  careerLevel: "Senior",
  preferredSalaryRange: "₹18,00,000 - ₹26,00,000 / year",
};

export const WORK_MODE_OPTIONS: CandidateWorkMode[] = ["Remote", "Hybrid", "On-site"];

export const EMPLOYMENT_TYPE_OPTIONS: CandidateEmploymentType[] = [
  "Full-time",
  "Contract",
  "Part-time",
];

export const CAREER_LEVEL_OPTIONS: { value: CandidateCareerLevel; label: string }[] = [
  { value: "Entry Level", label: "Entry Level (0-2 yrs)" },
  { value: "Mid Level", label: "Mid Level (3-5 yrs)" },
  { value: "Senior", label: "Senior (6-9 yrs)" },
  { value: "Lead", label: "Lead (10-14 yrs)" },
  { value: "Manager", label: "Manager (15+ yrs)" },
];

export const SAP_MODULE_OPTIONS = [
  "SAP ABAP",
  "SAP Fiori",
  "SAP UI5",
  "SAP BTP",
  "SAP MM",
  "SAP SD",
  "SAP FICO",
  "SAP SuccessFactors",
  "SAP Integration Suite",
  "SAP HCM",
  "SAP Basis",
  "SAP BW",
  "SAP S/4HANA",
  "SAP Ariba",
  "SAP CPI",
] as const;

export const JOB_ALERT_FREQUENCY_OPTIONS: { value: JobAlertFrequency; label: string; description: string }[] = [
  {
    value: "immediately",
    label: "Immediately",
    description: "Get notified as soon as matching SAP jobs are published",
  },
  {
    value: "daily",
    label: "Daily Digest",
    description: "A summary email once per day with all newly matching positions",
  },
  {
    value: "weekly",
    label: "Weekly Digest",
    description: "A comprehensive weekly overview of relevant job openings",
  },
];

export const TALENT_HUB_VISIBILITY_OPTIONS: {
  value: TalentHubVisibilityState;
  label: string;
  badge?: string;
  description: string;
}[] = [
  {
    value: "private",
    label: "Private",
    description: "Your profile is not visible to employers.",
  },
  {
    value: "employer_visible",
    label: "Visible to Employers",
    description: "Employers can discover your SAP profile through Talent Hub.",
  },
  {
    value: "open_to_opportunities",
    label: "Open to Opportunities",
    badge: "Active",
    description: "Let employers know you're open to relevant SAP opportunities.",
  },
];

export const PROFILE_VISIBILITY_OPTIONS: {
  value: ProfileVisibilityTier;
  label: string;
  badge?: string;
  description: string;
}[] = [
  {
    value: "private",
    label: "Private",
    description: "Your profile is not visible to employers.",
  },
  {
    value: "employer_visible",
    label: "Visible to Employers",
    description: "Employers can discover your SAP profile through Talent Hub.",
  },
  {
    value: "open_to_opportunities",
    label: "Open to Opportunities",
    badge: "Active",
    description: "Let employers know you're open to relevant SAP opportunities.",
  },
];

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  {
    id: "account",
    label: "Account",
    description: "Identity & profile links",
    iconName: "User",
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Alerts & email preferences",
    iconName: "Bell",
  },
  {
    id: "job-preferences",
    label: "Job Preferences",
    description: "Role, location & work mode",
    iconName: "Briefcase",
  },
  {
    id: "privacy",
    label: "Privacy & Visibility",
    description: "Recruiter discoverability",
    iconName: "Shield",
  },
  {
    id: "security",
    label: "Security",
    description: "Password & credentials",
    iconName: "Lock",
  },
  {
    id: "subscription",
    label: "Subscription",
    description: "Plan & membership status",
    iconName: "CreditCard",
  },
  {
    id: "danger-zone",
    label: "Danger Zone",
    description: "Sign out & account deletion",
    iconName: "AlertTriangle",
  },
];
