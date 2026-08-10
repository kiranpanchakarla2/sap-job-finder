import type {
  EmployerJobRecord,
  JobSortOption,
  JobStatusFilter,
} from "../types/job.types";

export function filterAndSortJobs(
  jobs: EmployerJobRecord[],
  params: {
    search: string;
    status: JobStatusFilter;
    sort: JobSortOption;
  },
): EmployerJobRecord[] {
  const query = params.search.trim().toLowerCase();

  let filtered = jobs.filter((job) => {
    if (params.status !== "All" && job.status !== params.status) return false;
    if (!query) return true;
    return (
      job.title.toLowerCase().includes(query) ||
      job.sapModule.toLowerCase().includes(query) ||
      job.location.toLowerCase().includes(query)
    );
  });

  filtered = [...filtered].sort((a, b) => {
    switch (params.sort) {
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "most_applications":
        return b.applications - a.applications;
      case "deadline": {
        const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return aDeadline - bDeadline;
      }
      case "newest":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return filtered;
}
