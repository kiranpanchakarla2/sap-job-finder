import type {
  CandidateMatchProfile,
  DiscoveryJob,
  JobMatchResult,
  MatchTier,
} from "../types/job.types";

function includesIgnoreCase(haystack: string[], needle: string) {
  const n = needle.toLowerCase();
  return haystack.some((h) => h.toLowerCase().includes(n) || n.includes(h.toLowerCase()));
}

export function scoreJobMatch(
  job: DiscoveryJob,
  profile: CandidateMatchProfile,
): JobMatchResult {
  let score = 0;

  for (const skill of profile.skills) {
    if (
      includesIgnoreCase(job.requiredSkills, skill) ||
      includesIgnoreCase(job.preferredSkills, skill) ||
      includesIgnoreCase(job.sapModules, skill)
    ) {
      score += 1;
    }
  }

  for (const module of profile.sapModules) {
    if (includesIgnoreCase(job.sapModules, module)) {
      score += 1;
    }
  }

  for (const loc of profile.preferredLocations) {
    if (job.location.toLowerCase().includes(loc.toLowerCase())) {
      score += 1;
      break;
    }
  }

  const jobMax = job.experienceMax ?? job.experienceMin;
  if (
    profile.experienceYears >= job.experienceMin - 1 &&
    profile.experienceYears <= jobMax + 1
  ) {
    score += 1;
  }

  if (profile.workModes.includes(job.workMode)) {
    score += 1;
  }

  for (const role of profile.preferredJobRoles) {
    if (job.title.toLowerCase().includes(role.toLowerCase().split(" ")[0] ?? "")) {
      score += 1;
      break;
    }
  }

  let tier: MatchTier | null = null;
  if (score >= 5) tier = "strong";
  else if (score >= 3) tier = "good";
  else if (score >= 1) tier = "potential";

  return { score, tier };
}

export function getRecommendedJobs(
  jobs: DiscoveryJob[],
  profile: CandidateMatchProfile,
  limit = 4,
): Array<DiscoveryJob & { match: JobMatchResult }> {
  return jobs
    .map((job) => ({ job, match: scoreJobMatch(job, profile) }))
    .filter((entry) => entry.match.score > 0)
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, limit)
    .map((entry) => ({ ...entry.job, match: entry.match }));
}

export function getRelatedJobs(
  job: DiscoveryJob,
  allJobs: DiscoveryJob[],
  limit = 4,
): DiscoveryJob[] {
  return allJobs
    .filter((candidate) => candidate.id !== job.id && candidate.status === "active")
    .map((candidate) => {
      let score = 0;
      if (
        candidate.sapModules.some((m) =>
          job.sapModules.some((jm) => jm.toLowerCase() === m.toLowerCase()),
        )
      ) {
        score += 2;
      }
      if (
        candidate.location.split(",")[0]?.trim().toLowerCase() ===
        job.location.split(",")[0]?.trim().toLowerCase()
      ) {
        score += 1;
      }
      const titleTokens = job.title.toLowerCase().split(/\s+/);
      if (titleTokens.some((t) => t.length > 3 && candidate.title.toLowerCase().includes(t))) {
        score += 1;
      }
      return { candidate, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

export function getCompanyJobs(
  companyId: string,
  excludeJobId: string,
  allJobs: DiscoveryJob[],
  limit = 3,
): DiscoveryJob[] {
  return allJobs
    .filter(
      (j) =>
        j.companyId === companyId && j.id !== excludeJobId && j.status === "active",
    )
    .slice(0, limit);
}
