export type AnalyticsDateRange =
  | "7d"
  | "30d"
  | "90d"
  | "year"
  | "custom";

export type AnalyticsJobStatus = "Active" | "Draft" | "Paused" | "Closed";

export type AnalyticsKpi = {
  key: string;
  label: string;
  value: number;
  /** e.g. "+18.4%" compared with the previous selected period */
  trend: string | null;
  /** e.g. "vs previous period" */
  trendLabel: string | null;
  trendDirection: "up" | "down" | "flat" | null;
};

export type JobPerformanceRow = {
  jobId: string;
  title: string;
  status: AnalyticsJobStatus;
  applications: number;
  shortlisted: number;
  interviews: number;
  hires: number;
  hireRate: number;
  shortlistRate: number;
  interviewRate: number;
};

export type FunnelStage = {
  key: string;
  label: string;
  count: number;
  percentage: number;
};

export type StatusBreakdownItem = {
  key: string;
  label: string;
  count: number;
  percentage: number;
};

export type TrendPoint = {
  date: string;
  label: string;
  applications: number;
};

export type InterviewAnalytics = {
  scheduled: number;
  completed: number;
  cancelled: number;
  noShow: number;
  completionRate: number;
};

export type HiringOverview = {
  hires: number;
  hireRate: number;
  averageApplicationsPerHire: number | null;
  interviewToHireRate: number;
};

export type TopPerformingJob = {
  rank: number;
  jobId: string;
  title: string;
  applications: number;
  shortlistRate: number;
  interviewRate: number;
  hireRate: number;
  score: number;
};

export type AnalyticsJobOption = {
  id: string;
  title: string;
};

export type AnalyticsFilters = {
  dateRange: AnalyticsDateRange;
  jobId: string | "all";
  customStart?: string;
  customEnd?: string;
};

export type EmployerAnalyticsData = {
  hasJobs: boolean;
  jobs: AnalyticsJobOption[];
  kpis: AnalyticsKpi[];
  jobPerformance: JobPerformanceRow[];
  funnel: FunnelStage[];
  statusBreakdown: StatusBreakdownItem[];
  trend: TrendPoint[];
  interviews: InterviewAnalytics;
  hiring: HiringOverview;
  topJobs: TopPerformingJob[];
};

export type AnalyticsServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
