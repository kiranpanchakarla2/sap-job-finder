import { createClient } from "@/lib/supabase/client";
import { applicationService } from "@/features/employer-applicants";
import type { ApplicationStatus } from "@/features/employer-applicants";
import { teamService } from "@/features/employer-team/services/teamService";
import {
  computeInterviewStats,
  filterInterviewsByTab,
  getInterviewForApplication,
  getUpcomingInterviews,
} from "../lib/filterInterviews";
import { timeToMinutes, todayDateString } from "../lib/format";
import {
  INTERVIEW_SELECT,
  interviewersToJson,
  mapInterviewRow,
  normalizeInterviewJoinRow,
  type InterviewJoinRow,
} from "../lib/mappers";
import type {
  EmployerInterview,
  InterviewServiceResult,
  InterviewSummaryStats,
  InterviewTabFilter,
  Interviewer,
  SaveFeedbackInput,
  ScheduleInterviewInput,
  ShortlistedCandidateOption,
  UpdateInterviewInput,
} from "../types/interview.types";

const ERR = {
  auth: "Please sign in again to continue.",
  company: "Complete your company profile before managing interviews.",
  load: "Unable to load interviews.",
  loadOne: "Unable to load interview details.",
  schedule: "Unable to schedule interview.",
  update: "Unable to update interview.",
  cancel: "Unable to cancel interview.",
  complete: "Unable to complete interview.",
  noShow: "Unable to mark candidate as no-show.",
  feedback: "Unable to save interview feedback.",
  status: "Unable to update application status.",
  conflict: "Interviewer is unavailable at this time.",
} as const;

function isAuthSessionMissing(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { name?: string; message?: string };
  return (
    e.name === "AuthSessionMissingError" ||
    (typeof e.message === "string" && e.message.toLowerCase().includes("auth session missing"))
  );
}

function logError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    if (context === "auth" && isAuthSessionMissing(error)) {
      return;
    }
    console.error(`[interviewService] ${context}`, error);
  }
}

async function requireEmployerContext(): Promise<
  InterviewServiceResult<{ userId: string; companyId: string }>
> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logError("auth", authError);
    return { success: false, error: ERR.auth };
  }

  const { data: company, error: companyError } = await supabase
    .from("company_profiles")
    .select("id, setup_complete")
    .eq("user_id", user.id)
    .maybeSingle();

  if (companyError || !company?.id || !company.setup_complete) {
    logError("company", companyError);
    return { success: false, error: ERR.company };
  }

  return { success: true, data: { userId: user.id, companyId: company.id } };
}

function rangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return (
    timeToMinutes(startA) < timeToMinutes(endB) &&
    timeToMinutes(startB) < timeToMinutes(endA)
  );
}

async function fetchAllInterviews(): Promise<
  InterviewServiceResult<EmployerInterview[]>
> {
  const context = await requireEmployerContext();
  if (!context.success) return context;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("interviews")
    .select(INTERVIEW_SELECT)
    .order("scheduled_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    logError("listInterviews", error);
    return { success: false, error: ERR.load };
  }

  const interviews = (data ?? []).map((row) =>
    mapInterviewRow(normalizeInterviewJoinRow(row as Record<string, unknown>)),
  );
  return { success: true, data: interviews };
}

async function findInterviewerConflict(
  interviewers: Interviewer[],
  scheduledDate: string,
  startTime: string,
  endTime: string,
  excludeInterviewId?: string,
): Promise<string | null> {
  if (interviewers.length === 0) return null;

  const listResult = await fetchAllInterviews();
  if (!listResult.success) return null;

  const names = new Set(
    interviewers.map((person) => person.name.trim().toLowerCase()),
  );

  for (const interview of listResult.data) {
    if (excludeInterviewId && interview.id === excludeInterviewId) continue;
    if (interview.status !== "scheduled") continue;
    if (interview.scheduledDate !== scheduledDate) continue;
    if (
      !rangesOverlap(
        startTime,
        endTime,
        interview.startTime,
        interview.endTime,
      )
    ) {
      continue;
    }
    const conflict = interview.interviewers.find((person) =>
      names.has(person.name.trim().toLowerCase()),
    );
    if (conflict) {
      return `${conflict.name} is unavailable at this time.`;
    }
  }
  return null;
}

export const interviewService = {
  async getInterviewers(): Promise<Interviewer[]> {
    const result = await teamService.listMembers();
    if (!result.success) return [];

    return result.data
      .filter((member) => member.status === "active")
      .map((member) => ({
        id: member.id,
        name:
          [member.firstName, member.lastName].filter(Boolean).join(" ") ||
          member.email,
        email: member.email,
      }));
  },

  async listInterviews(
    tab: InterviewTabFilter = "all",
  ): Promise<InterviewServiceResult<EmployerInterview[]>> {
    const result = await fetchAllInterviews();
    if (!result.success) return result;
    return {
      success: true,
      data: filterInterviewsByTab(result.data, tab),
    };
  },

  async getStats(): Promise<InterviewServiceResult<InterviewSummaryStats>> {
    const result = await fetchAllInterviews();
    if (!result.success) return result;
    return { success: true, data: computeInterviewStats(result.data) };
  },

  async getInterview(
    id: string,
  ): Promise<InterviewServiceResult<EmployerInterview>> {
    const context = await requireEmployerContext();
    if (!context.success) return context;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("interviews")
      .select(INTERVIEW_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      logError("getInterview", error);
      return { success: false, error: ERR.loadOne };
    }
    if (!data) {
      return { success: false, error: ERR.loadOne };
    }

    return {
      success: true,
      data: mapInterviewRow(
        normalizeInterviewJoinRow(data as Record<string, unknown>),
      ),
    };
  },

  async getUpcoming(
    limit = 3,
  ): Promise<InterviewServiceResult<EmployerInterview[]>> {
    const result = await fetchAllInterviews();
    if (!result.success) return result;
    return {
      success: true,
      data: getUpcomingInterviews(result.data, limit),
    };
  },

  async getByApplication(
    applicationId: string,
  ): Promise<InterviewServiceResult<EmployerInterview | null>> {
    const result = await fetchAllInterviews();
    if (!result.success) return result;
    return {
      success: true,
      data: getInterviewForApplication(result.data, applicationId),
    };
  },

  async getByCandidate(
    candidateId: string,
  ): Promise<InterviewServiceResult<EmployerInterview | null>> {
    const result = await fetchAllInterviews();
    if (!result.success) return result;
    const today = todayDateString();
    const upcoming = result.data
      .filter(
        (interview) =>
          interview.candidateId === candidateId &&
          interview.status === "scheduled" &&
          interview.scheduledDate >= today,
      )
      .sort((a, b) => {
        const dateCmp = a.scheduledDate.localeCompare(b.scheduledDate);
        if (dateCmp !== 0) return dateCmp;
        return a.startTime.localeCompare(b.startTime);
      });
    return { success: true, data: upcoming[0] ?? null };
  },

  async listForApplication(
    applicationId: string,
  ): Promise<InterviewServiceResult<EmployerInterview[]>> {
    const result = await fetchAllInterviews();
    if (!result.success) return result;
    return {
      success: true,
      data: result.data.filter(
        (interview) => interview.applicationId === applicationId,
      ),
    };
  },

  async listShortlistedCandidates(): Promise<
    InterviewServiceResult<ShortlistedCandidateOption[]>
  > {
    const result = await applicationService.listApplications({
      status: "shortlisted",
      sort: "newest",
    });
    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      data: result.data.map((application) => ({
        applicationId: application.id,
        candidateId: application.candidateId,
        candidateName: application.candidateName,
        candidateAvatarUrl: application.avatarUrl,
        candidateRole: application.currentRole,
        candidateExperienceYears: application.experienceYears,
        candidateSapSkills: application.sapSkills,
        candidateLocation: application.location,
        jobId: application.appliedJobId,
        jobTitle: application.appliedJobTitle,
        sapModule: application.sapModule,
        jobLocation: application.jobLocation,
        employmentType: application.employmentType,
        applicationStatus: "shortlisted" as const,
      })),
    };
  },

  async scheduleInterview(
    input: ScheduleInterviewInput,
  ): Promise<InterviewServiceResult<EmployerInterview>> {
    const context = await requireEmployerContext();
    if (!context.success) return context;

    if (!input.applicationId) {
      return { success: false, error: "Select a shortlisted candidate." };
    }
    if (timeToMinutes(input.endTime) <= timeToMinutes(input.startTime)) {
      return { success: false, error: "End time must be after start time." };
    }

    const conflict = await findInterviewerConflict(
      input.interviewers,
      input.scheduledDate,
      input.startTime,
      input.endTime,
    );
    if (conflict) {
      return { success: false, error: conflict };
    }

    const timezone =
      input.timezone?.trim() ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      "UTC";

    const supabase = createClient();
    const { data, error } = await supabase.rpc("schedule_interview", {
      p_application_id: input.applicationId,
      p_scheduled_date: input.scheduledDate,
      p_start_time: input.startTime,
      p_end_time: input.endTime,
      p_timezone: timezone,
      p_type: input.type,
      p_meeting_link: input.meetingLink ?? null,
      p_phone_number: input.phoneNumber ?? null,
      p_location: input.location ?? null,
      p_notes: input.notes ?? null,
      p_interviewers: interviewersToJson(
        input.interviewers,
      ) as unknown as import("@/types/database").Json,
    });

    if (error || !data) {
      logError("scheduleInterview", error);
      const message = error?.message?.includes("Not authorized")
        ? "Unable to schedule interview."
        : error?.message?.includes("status")
          ? "Unable to schedule interview for this application."
          : ERR.schedule;
      return { success: false, error: message };
    }

    const created = data as { id: string };
    return this.getInterview(created.id);
  },

  async updateInterview(
    id: string,
    input: UpdateInterviewInput,
  ): Promise<InterviewServiceResult<EmployerInterview>> {
    const context = await requireEmployerContext();
    if (!context.success) return context;

    if (timeToMinutes(input.endTime) <= timeToMinutes(input.startTime)) {
      return { success: false, error: "End time must be after start time." };
    }

    const conflict = await findInterviewerConflict(
      input.interviewers,
      input.scheduledDate,
      input.startTime,
      input.endTime,
      id,
    );
    if (conflict) {
      return { success: false, error: conflict };
    }

    const timezone =
      input.timezone?.trim() ||
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      "UTC";

    const supabase = createClient();
    const { error } = await supabase
      .from("interviews")
      .update({
        scheduled_date: input.scheduledDate,
        start_time: input.startTime,
        end_time: input.endTime,
        timezone,
        type: input.type,
        meeting_link:
          input.type === "video" ? input.meetingLink?.trim() || null : null,
        phone_number:
          input.type === "phone" ? input.phoneNumber?.trim() || null : null,
        location:
          input.type === "in_person" ? input.location?.trim() || null : null,
        notes: input.notes?.trim() || null,
        interviewers: interviewersToJson(input.interviewers) as unknown as import("@/types/database").Json,
      })
      .eq("id", id);

    if (error) {
      logError("updateInterview", error);
      return { success: false, error: ERR.update };
    }

    return this.getInterview(id);
  },

  async cancelInterview(
    id: string,
  ): Promise<InterviewServiceResult<EmployerInterview>> {
    const context = await requireEmployerContext();
    if (!context.success) return context;

    const supabase = createClient();
    const { error } = await supabase
      .from("interviews")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) {
      logError("cancelInterview", error);
      return { success: false, error: ERR.cancel };
    }
    return this.getInterview(id);
  },

  async completeInterview(
    id: string,
  ): Promise<InterviewServiceResult<EmployerInterview>> {
    const context = await requireEmployerContext();
    if (!context.success) return context;

    const supabase = createClient();
    const { error } = await supabase
      .from("interviews")
      .update({ status: "completed" })
      .eq("id", id);

    if (error) {
      logError("completeInterview", error);
      return { success: false, error: ERR.complete };
    }
    return this.getInterview(id);
  },

  async markNoShow(
    id: string,
  ): Promise<InterviewServiceResult<EmployerInterview>> {
    const context = await requireEmployerContext();
    if (!context.success) return context;

    const supabase = createClient();
    const { error } = await supabase
      .from("interviews")
      .update({ status: "no_show" })
      .eq("id", id);

    if (error) {
      logError("markNoShow", error);
      return { success: false, error: ERR.noShow };
    }
    return this.getInterview(id);
  },

  async saveFeedback(
    id: string,
    input: SaveFeedbackInput,
  ): Promise<InterviewServiceResult<EmployerInterview>> {
    const context = await requireEmployerContext();
    if (!context.success) return context;

    const supabase = createClient();
    const payload = {
      interview_id: id,
      overall_rating: input.overallRating,
      technical_skills: input.technicalSkills,
      communication: input.communication,
      sap_knowledge: input.sapKnowledge,
      problem_solving: input.problemSolving,
      strengths: input.strengths.trim() || null,
      concerns: input.concerns.trim() || null,
      recommendation: input.recommendation,
      submitted_by: context.data.userId,
      submitted_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("interview_feedback")
      .upsert(payload, { onConflict: "interview_id" });

    if (error) {
      logError("saveFeedback", error);
      return { success: false, error: ERR.feedback };
    }

    // Ensure interview is completed when feedback is saved
    await supabase
      .from("interviews")
      .update({ status: "completed" })
      .eq("id", id)
      .eq("status", "scheduled");

    return this.getInterview(id);
  },

  async updateLinkedApplicationStatus(
    applicationId: string,
    status: "hired" | "rejected",
  ): Promise<InterviewServiceResult<true>> {
    const result = await applicationService.updateStatus(applicationId, status);
    if (!result.success) {
      return { success: false, error: result.error || ERR.status };
    }
    return { success: true, data: true };
  },
};

// Keep type import used for ApplicationStatus syncs
export type { ApplicationStatus, InterviewJoinRow };
