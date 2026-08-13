import type {
  DashboardServiceResult,
  EmployerApplicantSummary,
  EmployerDashboardData,
  EmployerInterviewSummary,
  EmployerJobSummary,
  EmployerMessageSummary,
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
import { analyticsService } from "@/features/employer-analytics";
import {
  hasPlanEntitlement,
  subscriptionService,
} from "@/features/employer-subscription";
import { messageService } from "@/features/employer-messages";
import { getLastMessagePreview } from "@/features/employer-messages/lib/format";

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
 * Company/jobs/applicants/interviews/messages from existing feature services.
 * Job performance KPIs are enriched via analyticsService.
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

      const subscriptionResult = await subscriptionService.getSubscription();
      const planId = subscriptionResult.success
        ? subscriptionResult.data.planId
        : "free";
      const includeAdvanced = hasPlanEntitlement(planId, "advancedAnalytics");

      const [
        jobStatsResult,
        applicationsResult,
        statsResult,
        interviewsResult,
        interviewStatsResult,
        analyticsResult,
        messagesResult,
      ] = await Promise.all([
        jobService.getDashboardJobStats(),
        applicationService.listApplications({ sort: "newest" }),
        applicationService.getStats(),
        interviewService.getUpcoming(3),
        interviewService.getStats(),
        analyticsService.getAnalytics(
          { dateRange: "30d", jobId: "all" },
          { includeAdvanced },
        ),
        messageService.listConversations(),
      ]);

      if (!jobStatsResult.success) {
        return { success: false, error: jobStatsResult.error };
      }

      const jobStats = jobStatsResult.data;
      const upcomingInterviews: EmployerInterviewSummary[] =
        !interviewsResult.success
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

      const upcomingInterviewCount = interviewStatsResult.success
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
        !applicationsResult.success
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

      const countByJob = new Map<string, number>();
      if (applicationsResult.success) {
        for (const app of applicationsResult.data) {
          countByJob.set(
            app.appliedJobId,
            (countByJob.get(app.appliedJobId) ?? 0) + 1,
          );
        }
      }

      const recentJobs = jobStats.recentJobs.map((job) =>
            toJobSummary({
              ...job,
              applications: countByJob.get(job.id) ?? job.applications,
            }),
          );

      const jobPerformance =
        analyticsResult.success
          ? analyticsResult.data.jobPerformance
              .filter((row) => row.status === "Active")
              .slice(0, 3)
              .map((row) => ({
                jobId: row.jobId,
                title: row.title,
                applications: row.applications,
                interviews: row.interviews,
                hires: row.hires,
              }))
          : [];

      const recentMessages: EmployerMessageSummary[] =
        !messagesResult.success
          ? []
          : messagesResult.data.slice(0, 5).map((conversation) => {
              const lastContent =
                conversation.messages[conversation.messages.length - 1]
                  ?.content ?? "No messages yet.";
              return {
                id: conversation.id,
                candidate: conversation.candidateName,
                job: conversation.jobTitle,
                preview: getLastMessagePreview(lastContent),
                unreadCount: conversation.unreadCount,
                lastMessageAt: conversation.lastMessageAt,
              };
            });

      return {
        success: true,
        data: {
          companyName,
          stats: {
            activeJobs: jobStats.activeJobs,
            totalApplications: applicationStats.total,
            upcomingInterviews: upcomingInterviewCount,
            hires: applicationStats.hired,
            activeJobsDelta: `${jobStats.activeJobs} open now`,
            applicationsDelta: `${applicationStats.new} new`,
            interviewsDelta:
              upcomingInterviewCount > 0
                ? `${upcomingInterviewCount} scheduled`
                : "None scheduled",
            hiresDelta:
              applicationStats.hired > 0
                ? `${applicationStats.hired} total`
                : "None yet",
          },
          recentJobs,
          jobPerformance,
          recentApplicants,
          upcomingInterviews,
          recentMessages,
        },
      };
    } catch {
      return { success: false, error: "Unable to load dashboard data." };
    }
  },
};
