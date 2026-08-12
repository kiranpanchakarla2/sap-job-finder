import type {
  CandidateProfileForm,
  ProfileFieldErrors,
} from "../types/profile.types";

export function validateCandidateProfile(
  profile: CandidateProfileForm,
): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};

  if (!profile.personal.firstName.trim()) {
    errors.firstName = "First name is required";
  }
  if (!profile.personal.lastName.trim()) {
    errors.lastName = "Last name is required";
  }
  if (!profile.career.currentJobTitle.trim()) {
    errors.currentJobTitle = "Current job title is required";
  }
  if (!profile.personal.currentLocation.trim()) {
    errors.currentLocation = "Location is required";
  }

  return errors;
}

export function hasProfileErrors(errors: ProfileFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
