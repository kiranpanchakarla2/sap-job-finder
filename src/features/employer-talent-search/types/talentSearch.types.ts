export type TalentWorkMode = "remote" | "hybrid" | "onsite";

export type TalentEmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "contract_to_hire";

export type TalentAvailability =
  | "immediately"
  | "within_2_weeks"
  | "within_1_month"
  | "not_specified";

export type TalentCandidateStatus =
  | "open_to_opportunities"
  | "available"
  | "not_available";

export type TalentExperienceBand =
  | "0-2"
  | "3-5"
  | "6-8"
  | "9-12"
  | "13+";

export type TalentSearchSort =
  | "relevance"
  | "most_recent"
  | "experience_high"
  | "experience_low"
  | "available_soon";

export type TalentViewMode = "list" | "grid";

export type TalentExperienceEntry = {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string | null;
  description: string;
  skills: string[];
};

export type TalentEducationEntry = {
  id: string;
  school: string;
  degree: string;
  field: string;
  year: number;
};

export type TalentCertification = {
  id: string;
  name: string;
  type: string;
  year: number;
};

export type TalentCandidate = {
  id: string;
  name: string;
  avatarUrl: string | null;
  title: string;
  summary: string;
  yearsOfExperience: number;
  location: string;
  country: string;
  city: string;
  workModes: TalentWorkMode[];
  availability: TalentAvailability;
  employmentTypes: TalentEmploymentType[];
  candidateStatus: TalentCandidateStatus;
  sapModules: string[];
  skills: string[];
  certifications: TalentCertification[];
  languages: string[];
  experience: TalentExperienceEntry[];
  education: TalentEducationEntry[];
  isSearchable: boolean;
  lastUpdated: string;
};

export type TalentSearchFilters = {
  keyword: string;
  modules: string[];
  skills: string[];
  experienceBands: TalentExperienceBand[];
  experienceMin: number | null;
  countries: string[];
  locationQuery: string;
  workModes: TalentWorkMode[];
  employmentTypes: TalentEmploymentType[];
  availability: TalentAvailability[];
  candidateStatus: TalentCandidateStatus[];
  certifications: string[];
  languages: string[];
};

export type TalentSearchQuery = {
  filters: TalentSearchFilters;
  sort: TalentSearchSort;
  page: number;
  pageSize: number;
};

export type TalentSearchResult = {
  items: TalentCandidate[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type TalentSearchServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export type ActiveFilterChip = {
  id: string;
  category: keyof TalentSearchFilters | "experienceMin";
  label: string;
  value: string;
};
