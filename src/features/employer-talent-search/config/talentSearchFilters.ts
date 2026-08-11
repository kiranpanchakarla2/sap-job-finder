import type {
  TalentAvailability,
  TalentCandidateStatus,
  TalentEmploymentType,
  TalentExperienceBand,
  TalentSearchFilters,
  TalentSearchSort,
  TalentWorkMode,
} from "../types/talentSearch.types";

export const SAP_MODULE_OPTIONS = [
  "SAP S/4HANA",
  "SAP FICO",
  "SAP MM",
  "SAP SD",
  "SAP PP",
  "SAP HCM",
  "SAP SuccessFactors",
  "SAP EWM",
  "SAP WM",
  "SAP Ariba",
  "SAP IBP",
  "SAP BW/4HANA",
  "SAP BTP",
  "SAP Basis",
  "SAP Security",
  "SAP ABAP",
  "SAP CPI",
  "SAP Integration Suite",
] as const;

export const SKILL_OPTIONS = [
  "ABAP",
  "Fiori",
  "UI5",
  "CDS",
  "OData",
  "BTP",
  "CPI",
  "Integration Suite",
  "S/4HANA",
  "HANA",
  "BW",
  "FICO",
  "MM",
  "SD",
  "PP",
  "EWM",
  "Ariba",
  "SuccessFactors",
  "Basis",
  "Security",
] as const;

export const EXPERIENCE_BAND_OPTIONS: {
  value: TalentExperienceBand;
  label: string;
}[] = [
  { value: "0-2", label: "0–2 years" },
  { value: "3-5", label: "3–5 years" },
  { value: "6-8", label: "6–8 years" },
  { value: "9-12", label: "9–12 years" },
  { value: "13+", label: "13+ years" },
];

export const COUNTRY_OPTIONS = [
  "United States",
  "India",
  "Canada",
  "United Kingdom",
  "Germany",
  "Australia",
  "Singapore",
  "Netherlands",
] as const;

export const WORK_MODE_OPTIONS: { value: TalentWorkMode; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

export const EMPLOYMENT_TYPE_OPTIONS: {
  value: TalentEmploymentType;
  label: string;
}[] = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "contract_to_hire", label: "Contract-to-hire" },
];

export const AVAILABILITY_OPTIONS: {
  value: TalentAvailability;
  label: string;
}[] = [
  { value: "immediately", label: "Immediately" },
  { value: "within_2_weeks", label: "Within 2 weeks" },
  { value: "within_1_month", label: "Within 1 month" },
  { value: "not_specified", label: "Not specified" },
];

export const CANDIDATE_STATUS_OPTIONS: {
  value: TalentCandidateStatus;
  label: string;
}[] = [
  { value: "open_to_opportunities", label: "Open to Opportunities" },
  { value: "available", label: "Available" },
  { value: "not_available", label: "Not Available" },
];

export const CERTIFICATION_OPTIONS = [
  "SAP Certified Development Associate",
  "SAP Certified Application Professional",
  "SAP Certified Technology Professional",
  "SAP Certified Associate - S/4HANA",
  "SAP Certified Application Associate - SuccessFactors",
] as const;

export const LANGUAGE_OPTIONS = [
  "English",
  "German",
  "French",
  "Spanish",
  "Hindi",
  "Telugu",
] as const;

export const SORT_OPTIONS: { value: TalentSearchSort; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "most_recent", label: "Most Recent" },
  { value: "experience_high", label: "Experience: High to Low" },
  { value: "experience_low", label: "Experience: Low to High" },
  { value: "available_soon", label: "Available Soon" },
];

export const DEFAULT_PAGE_SIZE = 10;

export function createEmptyFilters(): TalentSearchFilters {
  return {
    keyword: "",
    modules: [],
    skills: [],
    experienceBands: [],
    experienceMin: null,
    countries: [],
    locationQuery: "",
    workModes: [],
    employmentTypes: [],
    availability: [],
    candidateStatus: [],
    certifications: [],
    languages: [],
  };
}

export function countActiveFilters(filters: TalentSearchFilters): number {
  let count = 0;
  count += filters.modules.length;
  count += filters.skills.length;
  count += filters.experienceBands.length;
  if (filters.experienceMin !== null) count += 1;
  count += filters.countries.length;
  if (filters.locationQuery.trim()) count += 1;
  count += filters.workModes.length;
  count += filters.employmentTypes.length;
  count += filters.availability.length;
  count += filters.candidateStatus.length;
  count += filters.certifications.length;
  count += filters.languages.length;
  return count;
}

export function workModeLabel(value: TalentWorkMode): string {
  return WORK_MODE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function employmentTypeLabel(value: TalentEmploymentType): string {
  return (
    EMPLOYMENT_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}

export function availabilityLabel(value: TalentAvailability): string {
  return (
    AVAILABILITY_OPTIONS.find((option) => option.value === value)?.label ?? value
  );
}

export function candidateStatusLabel(value: TalentCandidateStatus): string {
  return (
    CANDIDATE_STATUS_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}

export function experienceBandLabel(value: TalentExperienceBand): string {
  return (
    EXPERIENCE_BAND_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}
