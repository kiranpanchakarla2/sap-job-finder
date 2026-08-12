import type {
  CandidateProfileForm,
  ProfileCompletionCategory,
  ProfileCompletionResult,
} from "../types/profile.types";

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function isPersonalComplete(profile: CandidateProfileForm): boolean {
  const { personal } = profile;
  return (
    hasText(personal.firstName) &&
    hasText(personal.lastName) &&
    hasText(personal.email) &&
    hasText(personal.phone) &&
    hasText(personal.currentLocation)
  );
}

function isCareerComplete(profile: CandidateProfileForm): boolean {
  const { career } = profile;
  return (
    hasText(career.currentJobTitle) &&
    hasText(career.totalExperience) &&
    hasText(career.employmentStatus)
  );
}

function isPreferencesComplete(profile: CandidateProfileForm): boolean {
  const { preferences } = profile;
  return (
    preferences.preferredJobRoles.length > 0 &&
    preferences.workModes.length > 0 &&
    preferences.employmentTypes.length > 0
  );
}

/**
 * Reusable profile completion calculator.
 * Consumes the Sprint 1 local form model; later map Supabase rows into the same shape.
 */
export function calculateProfileCompletion(
  profile: CandidateProfileForm,
): ProfileCompletionResult {
  const categories: ProfileCompletionCategory[] = [
    {
      id: "personal",
      label: "Personal Information",
      complete: isPersonalComplete(profile),
    },
    {
      id: "summary",
      label: "Professional Summary",
      complete: hasText(profile.professionalSummary),
    },
    {
      id: "career",
      label: "Career Information",
      complete: isCareerComplete(profile),
    },
    {
      id: "sapSkills",
      label: "SAP Skills",
      complete:
        profile.sapExpertise.modules.length > 0 ||
        profile.sapExpertise.technicalSkills.length > 0,
    },
    {
      id: "certifications",
      label: "Certifications",
      complete: profile.certifications.length > 0,
    },
    {
      id: "preferences",
      label: "Job Preferences",
      complete: isPreferencesComplete(profile),
    },
    {
      id: "resume",
      label: "Resume (Sprint 2)",
      complete: profile.hasResume,
    },
  ];

  const completedCount = categories.filter((c) => c.complete).length;
  const totalCount = categories.length;
  const percent = Math.round((completedCount / totalCount) * 100);

  return { percent, completedCount, totalCount, categories };
}
