import type { AnalyticsJobStatus } from "../types/analytics.types";

export type MockJobSeed = {
  id: string;
  title: string;
  status: AnalyticsJobStatus;
  /** Daily application counts keyed by ISO date (yyyy-mm-dd) */
  dailyApplications: Record<string, number>;
  /** Status counts for the job (lifetime within seed window) */
  statusCounts: {
    new: number;
    reviewing: number;
    shortlisted: number;
    interview: number;
    hired: number;
    rejected: number;
  };
  interviewOutcomes: {
    scheduled: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
};

function buildDaily(
  start: string,
  values: number[],
): Record<string, number> {
  const result: Record<string, number> = {};
  const cursor = new Date(`${start}T12:00:00`);
  for (const value of values) {
    const key = cursor.toISOString().slice(0, 10);
    result[key] = value;
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

/** Generate a 120-day pattern ending around Aug 11, 2026 */
function patternFromSeed(seed: number, days = 120): number[] {
  const out: number[] = [];
  for (let i = 0; i < days; i += 1) {
    const wave = Math.sin((i + seed) / 6) * 1.5 + 2.2;
    const weekendDip = (i + seed) % 7 === 0 || (i + seed) % 7 === 6 ? 0.4 : 1;
    out.push(Math.max(0, Math.round(wave * weekendDip + (seed % 3) * 0.3)));
  }
  return out;
}

const START = "2026-04-14";

export const MOCK_ANALYTICS_JOBS: MockJobSeed[] = [
  {
    id: "job_s4hana",
    title: "SAP S/4HANA Consultant",
    status: "Active",
    dailyApplications: buildDaily(START, patternFromSeed(3).map((n) => n + 1)),
    statusCounts: {
      new: 22,
      reviewing: 28,
      shortlisted: 24,
      interview: 18,
      hired: 6,
      rejected: 16,
    },
    interviewOutcomes: {
      scheduled: 20,
      completed: 16,
      cancelled: 2,
      noShow: 2,
    },
  },
  {
    id: "job_mm",
    title: "SAP MM Consultant",
    status: "Active",
    dailyApplications: buildDaily(START, patternFromSeed(7)),
    statusCounts: {
      new: 18,
      reviewing: 20,
      shortlisted: 18,
      interview: 12,
      hired: 3,
      rejected: 11,
    },
    interviewOutcomes: {
      scheduled: 14,
      completed: 11,
      cancelled: 2,
      noShow: 1,
    },
  },
  {
    id: "job_fico",
    title: "SAP FICO Consultant",
    status: "Active",
    dailyApplications: buildDaily(START, patternFromSeed(11).map((n) => Math.max(0, n - 1))),
    statusCounts: {
      new: 14,
      reviewing: 16,
      shortlisted: 12,
      interview: 8,
      hired: 2,
      rejected: 10,
    },
    interviewOutcomes: {
      scheduled: 10,
      completed: 7,
      cancelled: 2,
      noShow: 1,
    },
  },
  {
    id: "job_abap",
    title: "SAP ABAP Developer",
    status: "Paused",
    dailyApplications: buildDaily(
      START,
      patternFromSeed(5).map((n, i) => (i > 90 ? 0 : Math.max(0, n - 1))),
    ),
    statusCounts: {
      new: 6,
      reviewing: 8,
      shortlisted: 6,
      interview: 4,
      hired: 1,
      rejected: 7,
    },
    interviewOutcomes: {
      scheduled: 5,
      completed: 4,
      cancelled: 1,
      noShow: 0,
    },
  },
  {
    id: "job_basis",
    title: "SAP Basis Administrator",
    status: "Closed",
    dailyApplications: buildDaily(
      START,
      patternFromSeed(2).map((n, i) => (i > 60 ? 0 : n)),
    ),
    statusCounts: {
      new: 2,
      reviewing: 4,
      shortlisted: 5,
      interview: 5,
      hired: 2,
      rejected: 8,
    },
    interviewOutcomes: {
      scheduled: 6,
      completed: 5,
      cancelled: 1,
      noShow: 0,
    },
  },
];

/** Set to true to exercise the empty analytics state. */
export const MOCK_ANALYTICS_EMPTY = false;

/** Set to true to exercise the analytics error state. */
export const MOCK_ANALYTICS_FORCE_ERROR = false;
