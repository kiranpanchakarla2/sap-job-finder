import {
  DASHBOARD_EMPTY_OVERRIDES,
  mockRecentApplicants,
  mockUpcomingInterviews,
} from "../data/employerDashboard.mock";
import type {
  DashboardServiceResult,
  EmployerDashboardData,
  EmployerJobSummary,
} from "../types/dashboard.types";
import { companyService } from "@/features/employer-company/services/companyService";
import { jobService } from "@/features/employer-jobs/services/jobService";
import { formatDisplayDate } from "@/features/employer-jobs/lib/format";

function toJobSummary(job: {
  id: string;
  title: string;
  sapModule: string;
  applications: number;
  status: EmployerJobSummary["status"];
  postedAt: string | null;
  createdAt: string;
}): EmployerJobSummary {
  return {
    id: job.id,
    title: job.title,
    sapModule: job.sapModule,
    applications: job.applications,
    status: job.status,
    postedAt: formatDisplayDate(job.postedAt ?? job.createdAt),
  };
}

/**
 * Employer dashboard service.
 * Company name comes from Supabase company_profiles.
 * Job counts / recent jobs come from Supabase jobs (Sprint 3B).
 * Applicants / interviews remain mock until later sprints.
 */
export const employerDashboardService = {
  async getDashboard(employerId: string): Promise<DashboardServiceResult<EmployerDashboardData>> {
    try {
      const companyResult = await companyService.getCompanyProfile(employerId);
      if (!companyResult.success) {
        return { success: false, error: companyResult.error };
      }

      const companyName =
        companyResult.data?.setupComplete && companyResult.data.companyName
          ? companyResult.data.companyName
          : "Your company";

      const jobStatsResult = await jobService.getDashboardJobStats();
      if (!jobStatsResult.success) {
        return { success: false, error: jobStatsResult.error };
      }

      const jobStats = jobStatsResult.data;
      const upcomingInterviews = DASHBOARD_EMPTY_OVERRIDES.interviews
        ? []
        : mockUpcomingInterviews;

      return {
        success: true,
        data: {
          companyName,
          stats: {
            activeJobs: jobStats.activeJobs,
            draftJobs: jobStats.draftJobs,
            totalApplications: jobStats.totalApplications,
            upcomingInterviews: upcomingInterviews.length,
            activeJobsDelta: `${jobStats.activeJobs} open now`,
            draftJobsDelta: `${jobStats.draftJobs} in progress`,
            applicationsDelta: "From current postings",
            interviewsDelta:
              upcomingInterviews.length > 0
                ? `${upcomingInterviews.length} scheduled`
                : "None scheduled",
          },
          recentJobs: DASHBOARD_EMPTY_OVERRIDES.jobs
            ? []
            : jobStats.recentJobs.map(toJobSummary),
          recentApplicants: DASHBOARD_EMPTY_OVERRIDES.applicants
            ? []
            : mockRecentApplicants,
          upcomingInterviews,
        },
      };
    } catch {
      return { success: false, error: "Unable to load dashboard data." };
    }
  },
};
