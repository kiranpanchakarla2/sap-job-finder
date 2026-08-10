import type {
  ApplicationQuery,
  ApplicationSummaryStats,
  EmployerApplication,
} from "../types/application.types";

function matchesExperience(
  years: number,
  experienceFilter: string | undefined,
): boolean {
  if (!experienceFilter || experienceFilter === "all") return true;
  if (experienceFilter === "0-3") return years >= 0 && years <= 3;
  if (experienceFilter === "4-6") return years >= 4 && years <= 6;
  if (experienceFilter === "7-10") return years >= 7 && years <= 10;
  if (experienceFilter === "10+") return years >= 10;
  return true;
}

export function filterAndSortApplications(
  applications: EmployerApplication[],
  query: ApplicationQuery = {},
): EmployerApplication[] {
  const search = query.search?.trim().toLowerCase() ?? "";
  const status = query.status ?? "all";
  const jobId = query.jobId?.trim() ?? "";
  const location = query.location?.trim().toLowerCase() ?? "";
  const sort = query.sort ?? "newest";

  let result = applications.filter((app) => {
    if (status !== "all" && app.status !== status) return false;
    if (jobId && app.appliedJobId !== jobId) return false;
    if (location && !app.location.toLowerCase().includes(location)) return false;
    if (!matchesExperience(app.experienceYears, query.experience)) return false;

    if (!search) return true;

    const haystack = [
      app.candidateName,
      app.appliedJobTitle,
      app.sapModule,
      app.email,
      ...app.sapSkills,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(search);
  });

  result = [...result].sort((a, b) => {
    switch (sort) {
      case "oldest":
        return (
          new Date(a.applicationDate).getTime() -
          new Date(b.applicationDate).getTime()
        );
      case "most_experience":
        return b.experienceYears - a.experienceYears;
      case "recently_updated":
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case "newest":
      default:
        return (
          new Date(b.applicationDate).getTime() -
          new Date(a.applicationDate).getTime()
        );
    }
  });

  return result;
}

export function computeApplicationStats(
  applications: EmployerApplication[],
): ApplicationSummaryStats {
  return {
    total: applications.length,
    new: applications.filter((app) => app.status === "new").length,
    reviewing: applications.filter((app) => app.status === "reviewing").length,
    shortlisted: applications.filter((app) => app.status === "shortlisted").length,
    interview: applications.filter((app) => app.status === "interview").length,
    hired: applications.filter((app) => app.status === "hired").length,
    rejected: applications.filter((app) => app.status === "rejected").length,
  };
}

export function countApplicationsForJobTitle(
  applications: EmployerApplication[],
  jobTitle: string,
): number {
  const normalized = jobTitle.trim().toLowerCase();
  return applications.filter(
    (app) => app.appliedJobTitle.toLowerCase() === normalized,
  ).length;
}

export function getUniqueLocations(
  applications: EmployerApplication[],
): string[] {
  return Array.from(
    new Set(applications.map((app) => app.location.split(",")[0]?.trim() ?? "")),
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}
