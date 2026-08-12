import type {
  DiscoveryJob,
  ExperienceFilterOption,
  JobSearchState,
  PostedDateFilter,
  SalaryFilterOption,
} from "../types/job.types";

function experienceBucketRange(
  option: ExperienceFilterOption,
): { min: number; max: number } {
  switch (option) {
    case "Entry Level":
      return { min: 0, max: 1 };
    case "1–3 Years":
      return { min: 1, max: 3 };
    case "3–5 Years":
      return { min: 3, max: 5 };
    case "5–8 Years":
      return { min: 5, max: 8 };
    case "8–12 Years":
      return { min: 8, max: 12 };
    case "12+ Years":
      return { min: 12, max: 99 };
  }
}

function experienceOverlaps(
  job: DiscoveryJob,
  selected: ExperienceFilterOption[],
): boolean {
  if (!selected.length) return true;
  const jobMax = job.experienceMax ?? 99;
  return selected.some((option) => {
    const range = experienceBucketRange(option);
    return job.experienceMin <= range.max && jobMax >= range.min;
  });
}

function salaryBucketRange(
  option: SalaryFilterOption,
): { min: number; max: number } {
  switch (option) {
    case "Under ₹5 LPA":
      return { min: 0, max: 5 };
    case "₹5–10 LPA":
      return { min: 5, max: 10 };
    case "₹10–15 LPA":
      return { min: 10, max: 15 };
    case "₹15–25 LPA":
      return { min: 15, max: 25 };
    case "₹25–40 LPA":
      return { min: 25, max: 40 };
    case "₹40+ LPA":
      return { min: 40, max: 999 };
  }
}

function salaryMatches(job: DiscoveryJob, state: JobSearchState): boolean {
  const jobMin = job.salaryMin ?? 0;
  const jobMax = job.salaryMax ?? jobMin;

  if (state.salaryMinCustom != null && jobMax < state.salaryMinCustom) {
    return false;
  }
  if (state.salaryMaxCustom != null && jobMin > state.salaryMaxCustom) {
    return false;
  }

  if (!state.salaryRanges.length) return true;

  return state.salaryRanges.some((option) => {
    const range = salaryBucketRange(option);
    return jobMin <= range.max && jobMax >= range.min;
  });
}

function postedWithin(postedAt: string, filter: PostedDateFilter, now: Date): boolean {
  if (filter === "any") return true;
  const posted = new Date(postedAt).getTime();
  const ageMs = now.getTime() - posted;
  const day = 24 * 60 * 60 * 1000;
  const limits: Record<Exclude<PostedDateFilter, "any">, number> = {
    "24h": day,
    "3d": 3 * day,
    "7d": 7 * day,
    "14d": 14 * day,
    "30d": 30 * day,
  };
  return ageMs <= limits[filter];
}

function locationMatches(job: DiscoveryJob, state: JobSearchState): boolean {
  const freeText = state.location.trim().toLowerCase();
  if (freeText) {
    const hay = `${job.location} ${job.locations.join(" ")}`.toLowerCase();
    if (!hay.includes(freeText)) return false;
  }

  if (!state.locations.length) return true;

  return state.locations.some((loc) => {
    if (loc === "Other") {
      const known = [
        "hyderabad",
        "bengaluru",
        "bangalore",
        "pune",
        "mumbai",
        "chennai",
        "delhi",
        "noida",
        "gurugram",
        "gurgaon",
        "kolkata",
        "remote",
      ];
      const hay = job.location.toLowerCase();
      return !known.some((k) => hay.includes(k));
    }
    const needle = loc.toLowerCase();
    const hay = `${job.location} ${job.locations.join(" ")}`.toLowerCase();
    if (needle === "bengaluru") {
      return hay.includes("bengaluru") || hay.includes("bangalore");
    }
    return hay.includes(needle);
  });
}

function keywordMatches(job: DiscoveryJob, keyword: string): boolean {
  const q = keyword.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    job.title,
    job.companyName,
    job.description,
    job.location,
    ...job.requiredSkills,
    ...job.preferredSkills,
    ...job.sapModules,
    ...job.responsibilities,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function countActiveFilters(state: JobSearchState): number {
  let count = 0;
  if (state.keyword.trim()) count += 1;
  if (state.location.trim()) count += 1;
  count += state.experience.length;
  count += state.sapModules.length;
  count += state.locations.length;
  count += state.workModes.length;
  count += state.jobTypes.length;
  count += state.salaryRanges.length;
  if (state.salaryMinCustom != null || state.salaryMaxCustom != null) count += 1;
  if (state.postedDate !== "any") count += 1;
  return count;
}

export function buildResultsSummary(state: JobSearchState, total: number): {
  countLabel: string;
  contextLabel: string;
} {
  const countLabel = `${total} SAP job${total === 1 ? "" : "s"} found`;
  const kw = state.keyword.trim();
  const loc = state.location.trim() || state.locations[0] || "";
  if (kw && loc) {
    return { countLabel, contextLabel: `${kw} jobs in ${loc}` };
  }
  if (kw) {
    return { countLabel, contextLabel: `${kw} jobs` };
  }
  if (loc) {
    return { countLabel, contextLabel: `SAP jobs in ${loc}` };
  }
  if (state.sapModules.length === 1) {
    return { countLabel, contextLabel: `${state.sapModules[0]} opportunities` };
  }
  if (countActiveFilters(state) > 0) {
    return { countLabel, contextLabel: "Filtered SAP opportunities" };
  }
  return { countLabel, contextLabel: "Latest SAP opportunities" };
}

export function filterDiscoveryJobs(
  jobs: DiscoveryJob[],
  state: JobSearchState,
  now = new Date(),
): DiscoveryJob[] {
  return jobs.filter((job) => {
    if (job.status !== "active") return false;
    if (job.expiresAt && new Date(job.expiresAt) < now) return false;
    if (!keywordMatches(job, state.keyword)) return false;
    if (!locationMatches(job, state)) return false;
    if (!experienceOverlaps(job, state.experience)) return false;
    if (
      state.sapModules.length &&
      !state.sapModules.some((m) =>
        job.sapModules.some((jm) => jm.toLowerCase() === m.toLowerCase()),
      )
    ) {
      return false;
    }
    if (state.workModes.length && !state.workModes.includes(job.workMode)) {
      return false;
    }
    if (state.jobTypes.length && !state.jobTypes.includes(job.employmentType)) {
      return false;
    }
    if (!salaryMatches(job, state)) return false;
    if (!postedWithin(job.postedAt, state.postedDate, now)) return false;
    return true;
  });
}

export function sortDiscoveryJobs(
  jobs: DiscoveryJob[],
  sort: JobSearchState["sort"],
  relevanceScores?: Map<string, number>,
): DiscoveryJob[] {
  const copy = [...jobs];
  switch (sort) {
    case "recent":
      return copy.sort(
        (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
      );
    case "salary_high":
      return copy.sort((a, b) => (b.salaryMax ?? 0) - (a.salaryMax ?? 0));
    case "salary_low":
      return copy.sort((a, b) => (a.salaryMin ?? 0) - (b.salaryMin ?? 0));
    case "relevance":
    default:
      return copy.sort((a, b) => {
        const scoreA = relevanceScores?.get(a.id) ?? 0;
        const scoreB = relevanceScores?.get(b.id) ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      });
  }
}
