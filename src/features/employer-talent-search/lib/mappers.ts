import type {
  TalentAvailability,
  TalentCandidate,
  TalentCandidateStatus,
  TalentCertification,
  TalentEducationEntry,
  TalentEmploymentType,
  TalentExperienceEntry,
  TalentSearchResult,
  TalentWorkMode,
} from "../types/talentSearch.types";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asWorkModes(value: unknown): TalentWorkMode[] {
  return asStringArray(value).filter((item): item is TalentWorkMode =>
    item === "remote" || item === "hybrid" || item === "onsite",
  );
}

function asEmploymentTypes(value: unknown): TalentEmploymentType[] {
  return asStringArray(value).filter((item): item is TalentEmploymentType =>
    item === "full_time" ||
    item === "part_time" ||
    item === "contract" ||
    item === "contract_to_hire",
  );
}

function asAvailability(value: unknown): TalentAvailability {
  const v = asString(value, "not_specified");
  if (
    v === "immediately" ||
    v === "within_2_weeks" ||
    v === "within_1_month" ||
    v === "not_specified"
  ) {
    return v;
  }
  return "not_specified";
}

function asStatus(value: unknown): TalentCandidateStatus {
  const v = asString(value, "not_available");
  if (
    v === "open_to_opportunities" ||
    v === "available" ||
    v === "not_available"
  ) {
    return v;
  }
  return "not_available";
}

function mapExperience(value: unknown): TalentExperienceEntry[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const row = (item ?? {}) as Record<string, unknown>;
    return {
      id: asString(row.id, `exp_${index}`),
      company: asString(row.company, "Company"),
      role: asString(row.role, "Role"),
      startDate: asString(row.startDate),
      endDate:
        row.endDate === null || row.endDate === undefined
          ? null
          : asString(row.endDate),
      description: asString(row.description),
      skills: asStringArray(row.skills),
    };
  });
}

function mapEducation(value: unknown): TalentEducationEntry[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const row = (item ?? {}) as Record<string, unknown>;
    return {
      id: asString(row.id, `edu_${index}`),
      school: asString(row.school, "School"),
      degree: asString(row.degree),
      field: asString(row.field),
      year: asNumber(row.year),
    };
  });
}

function mapCertifications(value: unknown): TalentCertification[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const row = (item ?? {}) as Record<string, unknown>;
    return {
      id: asString(row.id, `cert_${index}`),
      name: asString(row.name, "Certification"),
      type: asString(row.type, "Certification listed"),
      year: asNumber(row.year),
    };
  });
}

export function mapTalentCandidate(raw: unknown): TalentCandidate | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = asString(row.id);
  if (!id) return null;

  return {
    id,
    name: asString(row.name, "Candidate"),
    avatarUrl:
      row.avatarUrl === null || row.avatarUrl === undefined
        ? null
        : asString(row.avatarUrl),
    title: asString(row.title, "SAP Professional"),
    summary: asString(row.summary),
    yearsOfExperience: asNumber(row.yearsOfExperience),
    location: asString(row.location, "Location not specified"),
    country: asString(row.country),
    city: asString(row.city),
    workModes: asWorkModes(row.workModes),
    availability: asAvailability(row.availability),
    employmentTypes: asEmploymentTypes(row.employmentTypes),
    candidateStatus: asStatus(row.candidateStatus),
    sapModules: asStringArray(row.sapModules),
    skills: asStringArray(row.skills),
    certifications: mapCertifications(row.certifications),
    languages: asStringArray(row.languages),
    experience: mapExperience(row.experience),
    education: mapEducation(row.education),
    isSearchable: Boolean(row.isSearchable),
    lastUpdated: asString(row.lastUpdated, new Date().toISOString()),
  };
}

export function mapTalentSearchResult(raw: unknown): TalentSearchResult | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const itemsRaw = Array.isArray(row.items) ? row.items : [];
  const items = itemsRaw
    .map((item) => mapTalentCandidate(item))
    .filter((item): item is TalentCandidate => Boolean(item));

  return {
    items,
    total: asNumber(row.total),
    page: asNumber(row.page, 1),
    pageSize: asNumber(row.pageSize, 10),
    totalPages: asNumber(row.totalPages),
  };
}

export function mapTalentError(error: unknown): string {
  const message =
    typeof error === "object" &&
    error &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
      ? (error as { message: string }).message
      : typeof error === "string"
        ? error
        : "";

  if (message.includes("TALENT_SEARCH_LIMIT_REACHED")) {
    return "TALENT_SEARCH_LIMIT_REACHED";
  }
  if (message.includes("CANDIDATE_NOT_AVAILABLE")) {
    return "CANDIDATE_NOT_AVAILABLE";
  }
  if (message.includes("UNAUTHORIZED")) {
    return "UNAUTHORIZED";
  }
  return "GENERIC";
}

export function talentErrorMessage(code: string): string {
  switch (code) {
    case "TALENT_SEARCH_LIMIT_REACHED":
      return "You've reached your Talent Search limit for this period.";
    case "CANDIDATE_NOT_AVAILABLE":
      return "This candidate is no longer available.";
    case "UNAUTHORIZED":
      return "Please sign in to continue.";
    default:
      return "Unable to load candidates. Please try again.";
  }
}
