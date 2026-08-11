import {
  MOCK_ANALYTICS_EMPTY,
  MOCK_ANALYTICS_FORCE_ERROR,
  MOCK_ANALYTICS_JOBS,
  type MockJobSeed,
} from "../data/mockAnalytics";
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
  HiringOverview,
  InterviewAnalytics,
  JobPerformanceRow,
  StatusBreakdownItem,
  TopPerformingJob,
  TrendPoint,
} from "../types/analytics.types";

const LOAD_DELAY_MS = 400;
const TREND_LABEL = "vs previous period";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function resolveRange(
  filters: AnalyticsFilters,
  now = new Date("2026-08-11T12:00:00"),
): { start: Date; end: Date; previousStart: Date; previousEnd: Date } {
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
      if (filters.customEnd) {
        return resolveCustomWithPrevious(
          start,
          startOfDay(new Date(`${filters.customEnd}T12:00:00`)),
        );
      }
      break;
    }
    default:
      break;
  }

  return resolveCustomWithPrevious(start, end);
}

function resolveCustomWithPrevious(start: Date, end: Date) {
  const spanDays =
    Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000)) + 1;
  const previousEnd = addDays(start, -1);
  const previousStart = addDays(previousEnd, -(spanDays - 1));
  return { start, end, previousStart, previousEnd };
}

function inRange(iso: string, start: Date, end: Date): boolean {
  const t = new Date(`${iso}T12:00:00`).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function sumDaily(
  job: MockJobSeed,
  start: Date,
  end: Date,
): number {
  let total = 0;
  for (const [date, count] of Object.entries(job.dailyApplications)) {
    if (inRange(date, start, end)) total += count;
  }
  return total;
}

function selectJobs(filters: AnalyticsFilters): MockJobSeed[] {
  if (MOCK_ANALYTICS_EMPTY) return [];
  if (filters.jobId === "all") return MOCK_ANALYTICS_JOBS;
  return MOCK_ANALYTICS_JOBS.filter((job) => job.id === filters.jobId);
}

function scaleStatus(
  job: MockJobSeed,
  applicationsInRange: number,
): MockJobSeed["statusCounts"] {
  const lifetimeApps = Object.values(job.statusCounts).reduce((a, b) => a + b, 0);
  if (lifetimeApps <= 0 || applicationsInRange <= 0) {
    return {
      new: 0,
      reviewing: 0,
      shortlisted: 0,
      interview: 0,
      hired: 0,
      rejected: 0,
    };
  }
  const ratio = applicationsInRange / lifetimeApps;
  const scaled = {
    new: Math.round(job.statusCounts.new * ratio),
    reviewing: Math.round(job.statusCounts.reviewing * ratio),
    shortlisted: Math.round(job.statusCounts.shortlisted * ratio),
    interview: Math.round(job.statusCounts.interview * ratio),
    hired: Math.round(job.statusCounts.hired * ratio),
    rejected: Math.round(job.statusCounts.rejected * ratio),
  };
  const sum = Object.values(scaled).reduce((a, b) => a + b, 0);
  if (sum !== applicationsInRange) {
    scaled.new = Math.max(0, scaled.new + (applicationsInRange - sum));
  }
  return scaled;
}

function scaleInterviews(
  job: MockJobSeed,
  applicationsInRange: number,
): MockJobSeed["interviewOutcomes"] {
  const lifetimeApps = Object.values(job.statusCounts).reduce((a, b) => a + b, 0);
  if (lifetimeApps <= 0 || applicationsInRange <= 0) {
    return { scheduled: 0, completed: 0, cancelled: 0, noShow: 0 };
  }
  const ratio = applicationsInRange / lifetimeApps;
  return {
    scheduled: Math.round(job.interviewOutcomes.scheduled * ratio),
    completed: Math.round(job.interviewOutcomes.completed * ratio),
    cancelled: Math.round(job.interviewOutcomes.cancelled * ratio),
    noShow: Math.round(job.interviewOutcomes.noShow * ratio),
  };
}

function buildTrend(
  jobs: MockJobSeed[],
  start: Date,
  end: Date,
  dateRange: AnalyticsDateRange,
): TrendPoint[] {
  const points: TrendPoint[] = [];
  const cursor = new Date(start);
  const daySpan =
    Math.round((end.getTime() - start.getTime()) / 86400000) + 1;

  const useWeeklyBuckets = dateRange === "90d" || dateRange === "year" || daySpan > 45;

  if (!useWeeklyBuckets) {
    while (cursor.getTime() <= end.getTime()) {
      const iso = toIsoDate(cursor);
      let applications = 0;
      for (const job of jobs) {
        applications += job.dailyApplications[iso] ?? 0;
      }
      points.push({
        date: iso,
        label: cursor.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        applications,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return points;
  }

  while (cursor.getTime() <= end.getTime()) {
    const weekStart = new Date(cursor);
    const weekEnd = addDays(weekStart, 6);
    const cappedEnd = weekEnd.getTime() > end.getTime() ? end : weekEnd;
    let applications = 0;
    const day = new Date(weekStart);
    while (day.getTime() <= cappedEnd.getTime()) {
      const iso = toIsoDate(day);
      for (const job of jobs) {
        applications += job.dailyApplications[iso] ?? 0;
      }
      day.setDate(day.getDate() + 1);
    }
    points.push({
      date: toIsoDate(weekStart),
      label: weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      applications,
    });
    cursor.setDate(cursor.getDate() + 7);
  }
  return points;
}

function buildAnalytics(filters: AnalyticsFilters): EmployerAnalyticsData {
  const jobs = selectJobs(filters);
  const allJobs = MOCK_ANALYTICS_EMPTY ? [] : MOCK_ANALYTICS_JOBS;
  const { start, end, previousStart, previousEnd } = resolveRange(filters);

  if (jobs.length === 0) {
    return {
      hasJobs: allJobs.length > 0,
      jobs: allJobs.map((job) => ({ id: job.id, title: job.title })),
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

  const jobPerformance: JobPerformanceRow[] = jobs.map((job) => {
    const applications = sumDaily(job, start, end);
    const status = scaleStatus(job, applications);
    const shortlisted = status.shortlisted + status.interview + status.hired;
    const interviews = status.interview + status.hired;
    const hires = status.hired;
    return {
      jobId: job.id,
      title: job.title,
      status: job.status,
      applications,
      shortlisted,
      interviews,
      hires,
      hireRate: safeRate(hires, applications),
      shortlistRate: safeRate(shortlisted, applications),
      interviewRate: safeRate(interviews, applications),
    };
  });

  const totals = jobPerformance.reduce(
    (acc, row) => {
      acc.applications += row.applications;
      acc.shortlisted += row.shortlisted;
      acc.interviews += row.interviews;
      acc.hires += row.hires;
      return acc;
    },
    { applications: 0, shortlisted: 0, interviews: 0, hires: 0 },
  );

  let prevApplications = 0;
  let prevHires = 0;
  let prevInterviews = 0;
  for (const job of jobs) {
    const apps = sumDaily(job, previousStart, previousEnd);
    const status = scaleStatus(job, apps);
    prevApplications += apps;
    prevHires += status.hired;
    prevInterviews += status.interview + status.hired;
  }

  const activeJobs = jobs.filter((job) => job.status === "Active").length;
  const totalJobs = jobs.length;
  const prevActive = Math.max(0, activeJobs - 1);
  const prevTotal = Math.max(0, totalJobs);

  const appsTrend = formatTrendPercent(totals.applications, prevApplications);
  const interviewsTrend = formatTrendPercent(totals.interviews, prevInterviews);
  const hiresTrend = formatTrendPercent(totals.hires, prevHires);
  const jobsTrend = formatTrendPercent(totalJobs, prevTotal);
  const activeTrend = formatTrendPercent(activeJobs, prevActive);
  const hireRate = safeRate(totals.hires, totals.applications);
  const prevHireRate = safeRate(prevHires, prevApplications);
  const hireRateTrend = formatTrendPercent(hireRate, prevHireRate);

  const statusTotals = jobs.reduce(
    (acc, job) => {
      const apps = sumDaily(job, start, end);
      const status = scaleStatus(job, apps);
      acc.new += status.new;
      acc.reviewing += status.reviewing;
      acc.shortlisted += status.shortlisted;
      acc.interview += status.interview;
      acc.hired += status.hired;
      acc.rejected += status.rejected;
      return acc;
    },
    {
      new: 0,
      reviewing: 0,
      shortlisted: 0,
      interview: 0,
      hired: 0,
      rejected: 0,
    },
  );

  const statusTotalCount = Object.values(statusTotals).reduce((a, b) => a + b, 0);

  const funnelRaw = [
    { key: "applications", label: "Applications", count: totals.applications },
    {
      key: "reviewing",
      label: "Reviewing",
      count: statusTotals.reviewing + statusTotals.shortlisted + statusTotals.interview + statusTotals.hired,
    },
    {
      key: "shortlisted",
      label: "Shortlisted",
      count: statusTotals.shortlisted + statusTotals.interview + statusTotals.hired,
    },
    {
      key: "interview",
      label: "Interview",
      count: statusTotals.interview + statusTotals.hired,
    },
    { key: "hired", label: "Hired", count: statusTotals.hired },
  ];

  const funnelBase = funnelRaw[0]?.count ?? 0;
  const funnel: FunnelStage[] = funnelRaw.map((stage) => ({
    ...stage,
    percentage: percentageOf(stage.count, funnelBase),
  }));

  const statusBreakdown: StatusBreakdownItem[] = [
    { key: "new", label: "New", count: statusTotals.new },
    { key: "reviewing", label: "Reviewing", count: statusTotals.reviewing },
    { key: "shortlisted", label: "Shortlisted", count: statusTotals.shortlisted },
    { key: "interview", label: "Interview", count: statusTotals.interview },
    { key: "hired", label: "Hired", count: statusTotals.hired },
    { key: "rejected", label: "Rejected", count: statusTotals.rejected },
  ].map((item) => ({
    ...item,
    percentage: percentageOf(item.count, statusTotalCount),
  }));

  const interviewAgg = jobs.reduce(
    (acc, job) => {
      const apps = sumDaily(job, start, end);
      const outcomes = scaleInterviews(job, apps);
      acc.scheduled += outcomes.scheduled;
      acc.completed += outcomes.completed;
      acc.cancelled += outcomes.cancelled;
      acc.noShow += outcomes.noShow;
      return acc;
    },
    { scheduled: 0, completed: 0, cancelled: 0, noShow: 0 },
  );

  const interviews: InterviewAnalytics = {
    ...interviewAgg,
    completionRate: safeRate(interviewAgg.completed, interviewAgg.scheduled),
  };

  const hiring: HiringOverview = {
    hires: totals.hires,
    hireRate,
    averageApplicationsPerHire:
      totals.hires > 0
        ? Math.round((totals.applications / totals.hires) * 10) / 10
        : null,
    interviewToHireRate: safeRate(totals.hires, totals.interviews),
  };

  const topJobs: TopPerformingJob[] = [...jobPerformance]
    .map((row) => {
      const score =
        row.applications * 0.25 +
        row.shortlistRate * 0.25 +
        row.interviewRate * 0.25 +
        row.hireRate * 0.25;
      return {
        rank: 0,
        jobId: row.jobId,
        title: row.title,
        applications: row.applications,
        shortlistRate: row.shortlistRate,
        interviewRate: row.interviewRate,
        hireRate: row.hireRate,
        score,
      };
    })
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
        value: totalJobs,
        trend: jobsTrend.trend,
        trendLabel: TREND_LABEL,
        trendDirection: jobsTrend.trendDirection,
      },
      {
        key: "activeJobs",
        label: "Active Jobs",
        value: activeJobs,
        trend: activeTrend.trend,
        trendLabel: TREND_LABEL,
        trendDirection: activeTrend.trendDirection,
      },
      {
        key: "applications",
        label: "Applications",
        value: totals.applications,
        trend: appsTrend.trend,
        trendLabel: TREND_LABEL,
        trendDirection: appsTrend.trendDirection,
      },
      {
        key: "interviews",
        label: "Interviews",
        value: totals.interviews,
        trend: interviewsTrend.trend,
        trendLabel: TREND_LABEL,
        trendDirection: interviewsTrend.trendDirection,
      },
      {
        key: "hires",
        label: "Hires",
        value: totals.hires,
        trend: hiresTrend.trend,
        trendLabel: TREND_LABEL,
        trendDirection: hiresTrend.trendDirection,
      },
      {
        key: "hireRate",
        label: "Hire Rate",
        value: Math.round(hireRate * 10) / 10,
        trend: hireRateTrend.trend,
        trendLabel: TREND_LABEL,
        trendDirection: hireRateTrend.trendDirection,
      },
    ],
    jobPerformance,
    funnel,
    statusBreakdown,
    trend: buildTrend(jobs, start, end, filters.dateRange),
    interviews,
    hiring,
    topJobs,
  };
}

export const analyticsService = {
  async getAnalytics(
    filters: AnalyticsFilters,
    _employerId?: string,
  ): Promise<AnalyticsServiceResult<EmployerAnalyticsData>> {
    try {
      await delay(LOAD_DELAY_MS);
      if (MOCK_ANALYTICS_FORCE_ERROR) {
        return { success: false, error: "Unable to load analytics." };
      }
      return { success: true, data: buildAnalytics(filters) };
    } catch {
      return { success: false, error: "Unable to load analytics." };
    }
  },
};
