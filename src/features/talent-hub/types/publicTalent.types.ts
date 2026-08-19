export type PublicWorkMode = "remote" | "hybrid" | "onsite";

export type PublicAvailability =
  | "available_now"
  | "within_2_weeks"
  | "within_1_month"
  | "exploring";

export type PublicRoleCategory =
  | "consultant"
  | "developer"
  | "architect"
  | "functional"
  | "technical"
  | "program-lead";

export type PublicExperienceBand =
  | "0-2"
  | "3-5"
  | "6-8"
  | "9-12"
  | "13+";

export type PublicTalentCandidate = {
  id: string; // Anonymized public ID (e.g. "talent-sap-fico-01")
  title: string; // Professional title (e.g. "Senior SAP FICO Consultant & S/4HANA Finance Lead")
  roleCategory: PublicRoleCategory;
  yearsOfExperience: number;
  experienceBand: PublicExperienceBand;
  location: string;
  city: string;
  country: string;
  workModes: PublicWorkMode[];
  availability: PublicAvailability;
  sapModules: string[];
  skills: string[];
  certifications: string[];
  summary: string; // Privacy-safe domain summary (no employer names or PII)
  discoveryStatus: "open_to_opportunities" | "available";
  profileViewsCount?: number;
};

export type PublicTalentSearchFilters = {
  keyword: string;
  type: string | null;
  modules: string[];
  skills: string[];
  experienceBands: PublicExperienceBand[];
  locations: string[];
  workModes: PublicWorkMode[];
  availability: PublicAvailability[];
};

export type PublicTalentSort =
  | "relevance"
  | "experience_high"
  | "experience_low"
  | "available_soon";

export type PublicTalentSearchQuery = {
  filters: PublicTalentSearchFilters;
  sort: PublicTalentSort;
  page: number;
  pageSize: number;
};

export type PublicTalentSearchResult = {
  items: PublicTalentCandidate[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
