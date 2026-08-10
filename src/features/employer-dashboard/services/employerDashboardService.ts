import { DASHBOARD_EMPTY_OVERRIDES } from "../data/employerDashboard.mock";
import type {
  DashboardServiceResult,
  EmployerApplicantSummary,
  EmployerDashboardData,
  EmployerInterviewSummary,
  EmployerJobSummary,
} from "../types/dashboard.types";
import { companyService } from "@/features/employer-company/services/companyService";
import {
  applicationService,
  formatApplicationDate,
  getStatusLabel,
} from "@/features/employer-applicants";
import { formatExperienceYears } from "@/features/employer-applicants/lib/format";
import {
  formatInterviewDate,
  formatInterviewTime,
} from "@/features/employer-interviews/lib/format";
import { interviewService } from "@/features/employer-interviews";
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
 * Company name + jobs from Supabase.
 * Applications from real job_applications (Sprint 4B).
 * Interviews from Sprint 5A mock service (Supabase in 5B).
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

      const [
        jobStatsResult,
        applicationsResult,
        statsResult,
        interviewsResult,
        interviewStatsResult,
      ] = await Promise.all([
        jobService.getDashboardJobStats(),
        applicationService.listApplications({ sort: "newest" }),
        applicationService.getStats(),
        interviewService.getUpcoming(3),
        interviewService.getStats(),
      ]);

      if (!jobStatsResult.success) {
        return { success: false, error: jobStatsResult.error };
      }

      const jobStats = jobStatsResult.data;
      const upcomingInterviews: EmployerInterviewSummary[] =
        DASHBOARD_EMPTY_OVERRIDES.interviews || !interviewsResult.success
          ? []
          : interviewsResult.data.map((interview) => ({
              id: interview.id,
              candidate: interview.candidateName,
              job: interview.jobTitle,
              date: formatInterviewDate(interview.scheduledDate),
              time: formatInterviewTime(interview.startTime),
              type:
                interview.type === "video"
                  ? ("Video" as const)
                  : interview.type === "phone"
                    ? ("Phone" as const)
                    : ("Onsite" as const),
            }));

      const upcomingInterviewCount = DASHBOARD_EMPTY_OVERRIDES.interviews
        ? 0
        : interviewStatsResult.success
          ? interviewStatsResult.data.upcoming
          : upcomingInterviews.length;

      const applicationStats = statsResult.success
        ? statsResult.data
        : {
            total: 0,
            new: 0,
            reviewing: 0,
            shortlisted: 0,
            interview: 0,
            hired: 0,
            rejected: 0,
          };

      const recentApplicants: EmployerApplicantSummary[] =
        DASHBOARD_EMPTY_OVERRIDES.applicants || !applicationsResult.success
          ? []
          : applicationsResult.data.slice(0, 5).map((app) => ({
              id: app.id,
              candidate: app.candidateName,
              position: app.appliedJobTitle,
              sapModule: app.sapModule,
              experience: formatExperienceYears(app.experienceYears),
              appliedAt: formatApplicationDate(app.applicationDate),
              status: getStatusLabel(app.status) as EmployerApplicantSummary["status"],
            }));

      // Overlay real application counts onto recent jobs by job id
      const countByJob = new Map<string, number>();
      if (applicationsResult.success) {
        for (const app of applicationsResult.data) {
          countByJob.set(
            app.appliedJobId,
            (countByJob.get(app.appliedJobId) ?? 0) + 1,
          );
        }
      }

      const recentJobs = DASHBOARD_EMPTY_OVERRIDES.jobs
        ? []
        : jobStats.recentJobs.map((job) =>
            toJobSummary({
              ...job,
              applications: countByJob.get(job.id) ?? job.applications,
            }),
          );

      return {
        success: true,
        data: {
          companyName,
          stats: {
            activeJobs: jobStats.activeJobs,
            draftJobs: jobStats.draftJobs,
            totalApplications: applicationStats.total,
            upcomingInterviews: upcomingInterviewCount,
            activeJobsDelta: `${jobStats.activeJobs} open now`,
            draftJobsDelta: `${jobStats.draftJobs} in progress`,
            applicationsDelta: `${applicationStats.new} new`,
            interviewsDelta:
              upcomingInterviewCount > 0
                ? `${upcomingInterviewCount} scheduled`
                : "None scheduled",
          },
          recentJobs,
          recentApplicants,
          upcomingInterviews,
        },
      };
    } catch {
      return { success: false, error: "Unable to load dashboard data." };
    }
  },
};
