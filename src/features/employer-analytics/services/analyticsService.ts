import { applicationService } from "@/features/employer-applicants";
import type {
  ApplicationStatus,
  EmployerApplication,
} from "@/features/employer-applicants/types/application.types";
import { interviewService } from "@/features/employer-interviews";
import type { EmployerInterview } from "@/features/employer-interviews/types/interview.types";
import { jobService } from "@/features/employer-jobs/services/jobService";
import type { EmployerJobRecord } from "@/features/employer-jobs/types/job.types";
import {
  formatTrendPercent,
  percentageOf,
  safeRate,
} from "../lib/calculations";
import type {
  AnalyticsDateRange,
  AnalyticsFilters,
  AnalyticsServiceResult,
  EmployerAnalyticsData,
  FunnelStage,
  JobPerformanceRow,
  StatusBreakdownItem,
  TrendPoint,
} from "../types/analytics.types";

const TREND_LABEL = "vs previous period";

type DateRange = {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
};

const APPLICATION_STATUSES: ApplicationStatus[] = [
  "new",
  "reviewing",
  "shortlisted",
  "interview",
  "hired",
  "rejected",
];

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function withPreviousRange(start: Date, end: Date): DateRange {
  const spanDays =
    Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000)) + 1;
  const previousEnd = addDays(start, -1);
  const previousStart = addDays(previousEnd, -(spanDays - 1));
  return { start, end, previousStart, previousEnd };
}

function resolveRange(filters: AnalyticsFilters, now = new Date()): DateRange {
  const end = startOfDay(now);
  let start = addDays(end, -29);

  switch (filters.dateRange) {
    case "7d":
      start = addDays(end, -6);
      break;
    case "30d":
      start = addDays(end, -29);
      break;
    case "90d":
      start = addDays(end, -89);
      break;
    case "year":
      start = new Date(end.getFullYear(), 0, 1);
      break;
    case "custom": {
      if (filters.customStart) {
        start = startOfDay(new Date(`${filters.customStart}T12:00:00`));
      }
      const customEnd = filters.customEnd
        ? startOfDay(new Date(`${filters.customEnd}T12:00:00`))
        : end;
      return withPreviousRange(start, customEnd);
    }
  }

  return withPreviousRange(start, end);
}

function isInRange(value: string, start: Date, end: Date): boolean {
  const date = startOfDay(new Date(value));
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
}

function countStatuses(applications: EmployerApplication[]) {
  const counts: Record<ApplicationStatus, number> = {
    new: 0,
    reviewing: 0,
    shortlisted: 0,
    interview: 0,
    hired: 0,
    rejected: 0,
  };
  for (const application of applications) {
    counts[application.status] += 1;
  }
  return counts;
}

function filterByJob<T extends { appliedJobId: string }>(
  rows: T[],
  jobId: AnalyticsFilters["jobId"],
): T[] {
  return jobId === "all"
    ? rows
    : rows.filter((row) => row.appliedJobId === jobId);
}

function filterInterviewsByJob(
  rows: EmployerInterview[],
  jobId: AnalyticsFilters["jobId"],
): EmployerInterview[] {
  return jobId === "all" ? rows : rows.filter((row) => row.jobId === jobId);
}

function buildTrend(
  applications: EmployerApplication[],
  start: Date,
  end: Date,
  dateRange: AnalyticsDateRange,
): TrendPoint[] {
  const points: TrendPoint[] = [];
  const cursor = new Date(start);
  const daySpan =
    Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const weekly = dateRange === "90d" || dateRange === "year" || daySpan > 45;

  while (cursor.getTime() <= end.getTime()) {
    const bucketStart = new Date(cursor);
    const bucketEnd = weekly
      ? new Date(Math.min(addDays(bucketStart, 6).getTime(), end.getTime()))
      : bucketStart;
    const count = applications.filter((application) =>
      isInRange(application.applicationDate, bucketStart, bucketEnd),
    ).length;

    points.push({
      date: toIsoDate(bucketStart),
      label: bucketStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      applications: count,
    });
    cursor.setDate(cursor.getDate() + (weekly ? 7 : 1));
  }

  return points;
}

function buildJobPerformance(
  jobs: EmployerJobRecord[],
  applications: EmployerApplication[],
): JobPerformanceRow[] {
  return jobs.map((job) => {
    const rows = applications.filter(
      (application) => application.appliedJobId === job.id,
    );
    const status = countStatuses(rows);
    const shortlisted = status.shortlisted + status.interview + status.hired;
    const interviews = status.interview + status.hired;
    const hires = status.hired;

    return {
      jobId: job.id,
      title: job.title,
      status: job.status,
      applications: rows.length,
      shortlisted,
      interviews,
      hires,
      hireRate: safeRate(hires, rows.length),
      shortlistRate: safeRate(shortlisted, rows.length),
      interviewRate: safeRate(interviews, rows.length),
    };
  });
}

function emptyAnalytics(jobs: EmployerJobRecord[]): EmployerAnalyticsData {
  return {
    hasJobs: jobs.length > 0,
    jobs: jobs.map((job) => ({ id: job.id, title: job.title })),
    kpis: [],
    jobPerformance: [],
    funnel: [],
    statusBreakdown: [],
    trend: [],
    interviews: {
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      completionRate: 0,
    },
    hiring: {
      hires: 0,
      hireRate: 0,
      averageApplicationsPerHire: null,
      interviewToHireRate: 0,
    },
    topJobs: [],
  };
}

function buildAnalytics(
  filters: AnalyticsFilters,
  allJobs: EmployerJobRecord[],
  allApplications: EmployerApplication[],
  allInterviews: EmployerInterview[],
): EmployerAnalyticsData {
  if (allJobs.length === 0) return emptyAnalytics(allJobs);

  const range = resolveRange(filters);
  const jobs =
    filters.jobId === "all"
      ? allJobs
      : allJobs.filter((job) => job.id === filters.jobId);
  const selectedApplications = filterByJob(allApplications, filters.jobId);
  const currentApplications = selectedApplications.filter((application) =>
    isInRange(application.applicationDate, range.start, range.end),
  );
  const previousApplications = selectedApplications.filter((application) =>
    isInRange(
      application.applicationDate,
      range.previousStart,
      range.previousEnd,
    ),
  );
  const selectedInterviews = filterInterviewsByJob(allInterviews, filters.jobId);
  const currentInterviews = selectedInterviews.filter((interview) =>
    isInRange(interview.scheduledDate, range.start, range.end),
  );
  const previousInterviews = selectedInterviews.filter((interview) =>
    isInRange(
      interview.scheduledDate,
      range.previousStart,
      range.previousEnd,
    ),
  );

  const status = countStatuses(currentApplications);
  const previousStatus = countStatuses(previousApplications);
  const shortlisted = status.shortlisted + status.interview + status.hired;
  const interviewApplications = status.interview + status.hired;
  const hires = status.hired;
  const jobPerformance = buildJobPerformance(jobs, currentApplications);
  const applicationsTrend = formatTrendPercent(
    currentApplications.length,
    previousApplications.length,
  );
  const interviewsTrend = formatTrendPercent(
    currentInterviews.length,
    previousInterviews.length,
  );
  const hiresTrend = formatTrendPercent(hires, previousStatus.hired);
  const hireRate = safeRate(hires, currentApplications.length);
  const previousHireRate = safeRate(
    previousStatus.hired,
    previousApplications.length,
  );
  const hireRateTrend = formatTrendPercent(hireRate, previousHireRate);
  const activeJobs = jobs.filter((job) => job.status === "Active").length;

  const funnelRaw = [
    {
      key: "applications",
      label: "Applications",
      count: currentApplications.length,
    },
    {
      key: "reviewing",
      label: "Reviewing",
      count:
        status.reviewing +
        status.shortlisted +
        status.interview +
        status.hired,
    },
    { key: "shortlisted", label: "Shortlisted", count: shortlisted },
    { key: "interview", label: "Interview", count: interviewApplications },
    { key: "hired", label: "Hired", count: hires },
  ];
  const funnel: FunnelStage[] = funnelRaw.map((stage) => ({
    ...stage,
    percentage: percentageOf(stage.count, currentApplications.length),
  }));

  const statusBreakdown: StatusBreakdownItem[] = APPLICATION_STATUSES.map(
    (key) => ({
      key,
      label: key === "new" ? "New" : `${key[0].toUpperCase()}${key.slice(1)}`,
      count: status[key],
      percentage: percentageOf(status[key], currentApplications.length),
    }),
  );

  const completedInterviews = currentInterviews.filter(
    (interview) => interview.status === "completed",
  ).length;
  const cancelledInterviews = currentInterviews.filter(
    (interview) => interview.status === "cancelled",
  ).length;
  const noShowInterviews = currentInterviews.filter(
    (interview) => interview.status === "no_show",
  ).length;
  const scheduledInterviews = currentInterviews.filter(
    (interview) => interview.status === "scheduled",
  ).length;

  const topJobs = [...jobPerformance]
    .map((row) => ({
      rank: 0,
      jobId: row.jobId,
      title: row.title,
      applications: row.applications,
      shortlistRate: row.shortlistRate,
      interviewRate: row.interviewRate,
      hireRate: row.hireRate,
      score:
        row.applications * 0.25 +
        row.shortlistRate * 0.25 +
        row.interviewRate * 0.25 +
        row.hireRate * 0.25,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  return {
    hasJobs: allJobs.length > 0,
    jobs: allJobs.map((job) => ({ id: job.id, title: job.title })),
    kpis: [
      {
        key: "totalJobs",
        label: "Total Jobs",
        value: jobs.length,
        trend: null,
        trendLabel: null,
        trendDirection: null,
      },
      {
        key: "activeJobs",
        label: "Active Jobs",
        value: activeJobs,
        trend: null,
        trendLabel: null,
        trendDirection: null,
      },
      {
        key: "applications",
        label: "Applications",
        value: currentApplications.length,
        ...applicationsTrend,
        trendLabel: TREND_LABEL,
      },
      {
        key: "interviews",
        label: "Interviews",
        value: currentInterviews.length,
        ...interviewsTrend,
        trendLabel: TREND_LABEL,
      },
      {
        key: "hires",
        label: "Hires",
        value: hires,
        ...hiresTrend,
        trendLabel: TREND_LABEL,
      },
      {
        key: "hireRate",
        label: "Hire Rate",
        value: Math.round(hireRate * 10) / 10,
        ...hireRateTrend,
        trendLabel: TREND_LABEL,
      },
    ],
    jobPerformance,
    funnel,
    statusBreakdown,
    trend: buildTrend(
      currentApplications,
      range.start,
      range.end,
      filters.dateRange,
    ),
    interviews: {
      scheduled: scheduledInterviews,
      completed: completedInterviews,
      cancelled: cancelledInterviews,
      noShow: noShowInterviews,
      completionRate: safeRate(completedInterviews, currentInterviews.length),
    },
    hiring: {
      hires,
      hireRate,
      averageApplicationsPerHire:
        hires > 0
          ? Math.round((currentApplications.length / hires) * 10) / 10
          : null,
      interviewToHireRate: safeRate(hires, interviewApplications),
    },
    topJobs,
  };
}

export const analyticsService = {
  async getAnalytics(
    filters: AnalyticsFilters,
    options?: { includeAdvanced?: boolean },
    _employerId?: string,
  ): Promise<AnalyticsServiceResult<EmployerAnalyticsData>> {
    try {
      const includeAdvanced = options?.includeAdvanced ?? true;
      const [jobs, applications, interviews] = await Promise.all([
        jobService.listJobs(),
        applicationService.listApplications(),
        includeAdvanced
          ? interviewService.listInterviews()
          : Promise.resolve({
              success: true as const,
              data: [] as EmployerInterview[],
            }),
      ]);

      if (!jobs.success || !applications.success || !interviews.success) {
        return { success: false, error: "Unable to load analytics." };
      }

      return {
        success: true,
        data: buildAnalytics(
          filters,
          jobs.data,
          applications.data,
          interviews.data,
        ),
      };
    } catch {
      return { success: false, error: "Unable to load analytics." };
    }
  },
};
