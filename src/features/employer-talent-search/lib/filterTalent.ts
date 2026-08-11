import type {
  ActiveFilterChip,
  TalentCandidate,
  TalentExperienceBand,
  TalentSearchFilters,
  TalentSearchQuery,
  TalentSearchResult,
  TalentSearchSort,
} from "../types/talentSearch.types";
import {
  availabilityLabel,
  candidateStatusLabel,
  employmentTypeLabel,
  experienceBandLabel,
  workModeLabel,
} from "../config/talentSearchFilters";

function matchesExperienceBand(
  years: number,
  bands: TalentExperienceBand[],
): boolean {
  if (!bands.length) return true;
  return bands.some((band) => {
    switch (band) {
      case "0-2":
        return years >= 0 && years <= 2;
      case "3-5":
        return years >= 3 && years <= 5;
      case "6-8":
        return years >= 6 && years <= 8;
      case "9-12":
        return years >= 9 && years <= 12;
      case "13+":
        return years >= 13;
      default:
        return false;
    }
  });
}

function includesAny(haystack: string[], needles: string[]): boolean {
  if (!needles.length) return true;
  const normalized = haystack.map((item) => item.toLowerCase());
  return needles.some((needle) => normalized.includes(needle.toLowerCase()));
}

function keywordScore(candidate: TalentCandidate, keyword: string): number {
  if (!keyword) return 0;
  const tokens = keyword
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
  if (!tokens.length) return 0;

  let score = 0;
  const title = candidate.title.toLowerCase();
  const modules = candidate.sapModules.join(" ").toLowerCase();
  const skills = candidate.skills.join(" ").toLowerCase();
  const summary = candidate.summary.toLowerCase();
  const name = candidate.name.toLowerCase();
  const certs = candidate.certifications.map((item) => item.name).join(" ").toLowerCase();

  for (const token of tokens) {
    if (title.includes(token)) score += 8;
    if (modules.includes(token)) score += 6;
    if (skills.includes(token)) score += 5;
    if (certs.includes(token)) score += 3;
    if (summary.includes(token)) score += 2;
    if (name.includes(token)) score += 1;
  }
  return score;
}

function matchesKeyword(candidate: TalentCandidate, keyword: string): boolean {
  if (!keyword.trim()) return true;
  return keywordScore(candidate, keyword) > 0;
}

function availabilityRank(value: TalentCandidate["availability"]): number {
  switch (value) {
    case "immediately":
      return 0;
    case "within_2_weeks":
      return 1;
    case "within_1_month":
      return 2;
    case "not_specified":
    default:
      return 3;
  }
}

export function filterCandidates(
  candidates: TalentCandidate[],
  filters: TalentSearchFilters,
): TalentCandidate[] {
  return candidates.filter((candidate) => {
    if (!candidate.isSearchable) return false;
    if (!matchesKeyword(candidate, filters.keyword)) return false;
    if (!includesAny(candidate.sapModules, filters.modules)) return false;
    if (!includesAny(candidate.skills, filters.skills)) return false;
    if (!matchesExperienceBand(candidate.yearsOfExperience, filters.experienceBands)) {
      return false;
    }
    if (
      filters.experienceMin !== null &&
      candidate.yearsOfExperience < filters.experienceMin
    ) {
      return false;
    }
    if (
      filters.countries.length &&
      !filters.countries.includes(candidate.country)
    ) {
      return false;
    }
    if (filters.locationQuery.trim()) {
      const q = filters.locationQuery.trim().toLowerCase();
      const locationHaystack = [
        candidate.location,
        candidate.city,
        candidate.country,
      ]
        .join(" ")
        .toLowerCase();
      if (!locationHaystack.includes(q)) return false;
    }
    if (
      filters.workModes.length &&
      !filters.workModes.some((mode) => candidate.workModes.includes(mode))
    ) {
      return false;
    }
    if (
      filters.employmentTypes.length &&
      !filters.employmentTypes.some((type) =>
        candidate.employmentTypes.includes(type),
      )
    ) {
      return false;
    }
    if (
      filters.availability.length &&
      !filters.availability.includes(candidate.availability)
    ) {
      return false;
    }
    if (
      filters.candidateStatus.length &&
      !filters.candidateStatus.includes(candidate.candidateStatus)
    ) {
      return false;
    }
    if (filters.certifications.length) {
      const names = candidate.certifications.map((item) => item.name);
      if (!includesAny(names, filters.certifications)) return false;
    }
    if (!includesAny(candidate.languages, filters.languages)) return false;
    return true;
  });
}

export function sortCandidates(
  candidates: TalentCandidate[],
  sort: TalentSearchSort,
  keyword: string,
): TalentCandidate[] {
  const items = [...candidates];
  switch (sort) {
    case "experience_high":
      return items.sort((a, b) => b.yearsOfExperience - a.yearsOfExperience);
    case "experience_low":
      return items.sort((a, b) => a.yearsOfExperience - b.yearsOfExperience);
    case "most_recent":
      return items.sort(
        (a, b) =>
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
      );
    case "available_soon":
      return items.sort(
        (a, b) =>
          availabilityRank(a.availability) - availabilityRank(b.availability),
      );
    case "relevance":
    default:
      return items.sort((a, b) => {
        const scoreDiff = keywordScore(b, keyword) - keywordScore(a, keyword);
        if (scoreDiff !== 0) return scoreDiff;
        return (
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        );
      });
  }
}

export function paginateCandidates(
  candidates: TalentCandidate[],
  page: number,
  pageSize: number,
): TalentSearchResult {
  const total = candidates.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: candidates.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages: total === 0 ? 0 : totalPages,
  };
}

export function searchTalentCandidates(
  candidates: TalentCandidate[],
  query: TalentSearchQuery,
): TalentSearchResult {
  const filtered = filterCandidates(candidates, query.filters);
  const sorted = sortCandidates(filtered, query.sort, query.filters.keyword);
  return paginateCandidates(sorted, query.page, query.pageSize);
}

export function buildActiveFilterChips(
  filters: TalentSearchFilters,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  for (const module of filters.modules) {
    chips.push({
      id: `modules:${module}`,
      category: "modules",
      label: module,
      value: module,
    });
  }
  for (const skill of filters.skills) {
    chips.push({
      id: `skills:${skill}`,
      category: "skills",
      label: skill,
      value: skill,
    });
  }
  for (const band of filters.experienceBands) {
    chips.push({
      id: `experienceBands:${band}`,
      category: "experienceBands",
      label: experienceBandLabel(band),
      value: band,
    });
  }
  if (filters.experienceMin !== null) {
    chips.push({
      id: `experienceMin:${filters.experienceMin}`,
      category: "experienceMin",
      label: `${filters.experienceMin}+ years`,
      value: String(filters.experienceMin),
    });
  }
  for (const country of filters.countries) {
    chips.push({
      id: `countries:${country}`,
      category: "countries",
      label: country,
      value: country,
    });
  }
  if (filters.locationQuery.trim()) {
    chips.push({
      id: `locationQuery:${filters.locationQuery}`,
      category: "locationQuery",
      label: filters.locationQuery.trim(),
      value: filters.locationQuery.trim(),
    });
  }
  for (const mode of filters.workModes) {
    chips.push({
      id: `workModes:${mode}`,
      category: "workModes",
      label: workModeLabel(mode),
      value: mode,
    });
  }
  for (const type of filters.employmentTypes) {
    chips.push({
      id: `employmentTypes:${type}`,
      category: "employmentTypes",
      label: employmentTypeLabel(type),
      value: type,
    });
  }
  for (const item of filters.availability) {
    chips.push({
      id: `availability:${item}`,
      category: "availability",
      label: availabilityLabel(item),
      value: item,
    });
  }
  for (const status of filters.candidateStatus) {
    chips.push({
      id: `candidateStatus:${status}`,
      category: "candidateStatus",
      label: candidateStatusLabel(status),
      value: status,
    });
  }
  for (const cert of filters.certifications) {
    chips.push({
      id: `certifications:${cert}`,
      category: "certifications",
      label: cert,
      value: cert,
    });
  }
  for (const language of filters.languages) {
    chips.push({
      id: `languages:${language}`,
      category: "languages",
      label: language,
      value: language,
    });
  }

  return chips;
}

export function removeFilterChip(
  filters: TalentSearchFilters,
  chip: ActiveFilterChip,
): TalentSearchFilters {
  const next: TalentSearchFilters = {
    ...filters,
    modules: [...filters.modules],
    skills: [...filters.skills],
    experienceBands: [...filters.experienceBands],
    countries: [...filters.countries],
    workModes: [...filters.workModes],
    employmentTypes: [...filters.employmentTypes],
    availability: [...filters.availability],
    candidateStatus: [...filters.candidateStatus],
    certifications: [...filters.certifications],
    languages: [...filters.languages],
  };

  switch (chip.category) {
    case "modules":
      next.modules = next.modules.filter((item) => item !== chip.value);
      break;
    case "skills":
      next.skills = next.skills.filter((item) => item !== chip.value);
      break;
    case "experienceBands":
      next.experienceBands = next.experienceBands.filter(
        (item) => item !== chip.value,
      );
      break;
    case "experienceMin":
      next.experienceMin = null;
      break;
    case "countries":
      next.countries = next.countries.filter((item) => item !== chip.value);
      break;
    case "locationQuery":
      next.locationQuery = "";
      break;
    case "workModes":
      next.workModes = next.workModes.filter((item) => item !== chip.value);
      break;
    case "employmentTypes":
      next.employmentTypes = next.employmentTypes.filter(
        (item) => item !== chip.value,
      );
      break;
    case "availability":
      next.availability = next.availability.filter((item) => item !== chip.value);
      break;
    case "candidateStatus":
      next.candidateStatus = next.candidateStatus.filter(
        (item) => item !== chip.value,
      );
      break;
    case "certifications":
      next.certifications = next.certifications.filter(
        (item) => item !== chip.value,
      );
      break;
    case "languages":
      next.languages = next.languages.filter((item) => item !== chip.value);
      break;
    default:
      break;
  }

  return next;
}
