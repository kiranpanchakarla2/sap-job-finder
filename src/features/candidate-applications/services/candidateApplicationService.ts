import { createClient } from "@/lib/supabase/client";
import {
  JOB_DETAIL_SELECT,
  mapJobRowToDiscovery,
  type DiscoveryJobRow,
} from "@/features/candidate-jobs/lib/mapJobRow";
import { toJobSnapshot } from "../lib/applicationUtils";
import type {
  ApplicationAnswer,
  ApplicationQuestion,
  ApplicationStatus,
  CandidateApplication,
  SelectableResume,
} from "../types/application.types";

type Result<T> = { success: true; data: T } | { success: false; error: string; code?: string };

type ApplicationRow = {
  id: string;
  job_id: string;
  candidate_id: string;
  resume_id: string | null;
  cover_letter: string | null;
  status: ApplicationStatus;
  applied_at: string;
  updated_at: string;
  withdrawn_at: string | null;
};

type ResumeRow = {
  id: string;
  resume_name: string;
  original_file_name: string | null;
  created_at: string;
  updated_at: string;
  is_primary: boolean;
};

type AnswerRow = { question_id: string; answer: string | null };
type HistoryRow = { status: ApplicationStatus; created_at: string };

function message(error: { message?: string; code?: string } | null, fallback: string) {
  if (error?.code === "23505") return "You have already applied to this job.";
  return error?.message || fallback;
}

function asAnswerValue(answer: string | null): ApplicationAnswer["answer"] {
  if (answer == null) return null;
  try {
    const parsed: unknown = JSON.parse(answer);
    if (
      typeof parsed === "string" ||
      typeof parsed === "number" ||
      typeof parsed === "boolean" ||
      (Array.isArray(parsed) && parsed.every((item) => typeof item === "string"))
    ) return parsed;
  } catch {
    // Plain text answers are expected for text inputs.
  }
  return answer;
}

function toAnswerText(answer: ApplicationAnswer["answer"]) {
  return typeof answer === "string" ? answer : JSON.stringify(answer);
}

async function candidateId(): Promise<Result<string>> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("current_candidate_id");
  if (error || !data) {
    return { success: false, error: "Sign in as a candidate to manage applications.", code: "UNAUTHENTICATED" };
  }
  return { success: true, data };
}

async function mapApplication(row: ApplicationRow): Promise<Result<CandidateApplication>> {
  const supabase = createClient();
  const { normalizeApplicationStatus } = await import("../constants");
  
  const [jobRes, resumeRes, answersRes, historyRes] = await Promise.all([
    supabase.from("jobs").select(JOB_DETAIL_SELECT).eq("id", row.job_id).maybeSingle(),
    row.resume_id
      ? supabase.from("candidate_resumes").select("id, resume_name, original_file_name, created_at, updated_at, is_primary").eq("id", row.resume_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase.from("application_answers").select("question_id, answer").eq("application_id", row.id),
    supabase.from("application_status_history").select("status, created_at").eq("application_id", row.id).order("created_at", { ascending: true }),
  ]);
  if (jobRes.error || !jobRes.data) return { success: false, error: "Unable to load application job details." };

  const job = mapJobRowToDiscovery(jobRes.data as unknown as DiscoveryJobRow);
  const resume = resumeRes.data as ResumeRow | null;
  const answers = ((answersRes.data ?? []) as AnswerRow[]).map((item) => ({
    questionId: item.question_id,
    answer: asAnswerValue(item.answer),
  }));
  const timeline = ((historyRes.data ?? []) as HistoryRow[]).map((item) => ({
    status: normalizeApplicationStatus(item.status as string),
    timestamp: item.created_at,
    label: normalizeApplicationStatus(item.status as string).replace(/_/g, " "),
  }));

  return {
    success: true,
    data: {
      id: row.id,
      candidateId: row.candidate_id,
      jobId: row.job_id,
      job: toJobSnapshot(job),
      resumeId: row.resume_id ?? "",
      resume: {
        resumeId: resume?.id ?? "",
        label: resume?.resume_name ?? "No resume selected",
        fileName: resume?.original_file_name ?? resume?.resume_name ?? "",
        updatedAt: resume?.updated_at ?? row.applied_at,
        skills: [],
      },
      coverLetter: row.cover_letter ?? "",
      answers,
      status: normalizeApplicationStatus(row.status as string),
      appliedAt: row.applied_at,
      updatedAt: row.updated_at,
      withdrawnAt: row.withdrawn_at,
      timeline,
    },
  };
}

export const candidateApplicationService = {
  async getCandidateApplications(): Promise<Result<CandidateApplication[]>> {
    const candidate = await candidateId();
    if (!candidate.success) return candidate;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("job_applications")
      .select("id, job_id, candidate_id, resume_id, cover_letter, status, applied_at, updated_at, withdrawn_at")
      .eq("candidate_id", candidate.data)
      .order("applied_at", { ascending: false });
    if (error) return { success: false, error: message(error, "Unable to load applications.") };
    const mapped = await Promise.all(((data ?? []) as ApplicationRow[]).map(mapApplication));
    const failed = mapped.find((item) => !item.success);
    if (failed && !failed.success) return failed;
    return { success: true, data: mapped.flatMap((item) => item.success ? [item.data] : []) };
  },

  async getCandidateApplication(applicationId: string): Promise<Result<CandidateApplication>> {
    const candidate = await candidateId();
    if (!candidate.success) return candidate;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("job_applications")
      .select("id, job_id, candidate_id, resume_id, cover_letter, status, applied_at, updated_at, withdrawn_at")
      .eq("id", applicationId)
      .eq("candidate_id", candidate.data)
      .maybeSingle();
    if (error || !data) return { success: false, error: message(error, "Application not found.") };
    return mapApplication(data as ApplicationRow);
  },

  async getExistingApplication(jobId: string): Promise<Result<CandidateApplication | null>> {
    const candidate = await candidateId();
    if (!candidate.success) return candidate;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("job_applications")
      .select("id, job_id, candidate_id, resume_id, cover_letter, status, applied_at, updated_at, withdrawn_at")
      .eq("job_id", jobId)
      .eq("candidate_id", candidate.data)
      .maybeSingle();
    if (error) return { success: false, error: message(error, "Unable to check existing application.") };
    if (!data) return { success: true, data: null };
    return mapApplication(data as ApplicationRow);
  },

  async getJobApplicationQuestions(jobId: string): Promise<Result<ApplicationQuestion[]>> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("job_application_questions")
      .select("id, question, question_type, required, options")
      .eq("job_id", jobId)
      .order("display_order", { ascending: true });
    if (error) return { success: false, error: "Unable to load application questions." };
    const typeMap: Record<string, ApplicationQuestion["type"]> = {
      text: "text", textarea: "textarea", number: "number", yes_no: "yesNo",
      single_select: "singleSelect", multiple_select: "multiSelect",
    };
    return {
      success: true,
      data: (data ?? []).flatMap((row) => {
        const type = typeMap[String(row.question_type)];
        if (!type) return [];
        return [{
          id: String(row.id), question: String(row.question), type,
          required: Boolean(row.required),
          options: Array.isArray(row.options) ? row.options.filter((item): item is string => typeof item === "string") : undefined,
        }];
      }),
    };
  },

  async submit(input: { jobId: string; resumeId: string | null; coverLetter: string; answers: ApplicationAnswer[] }): Promise<Result<string>> {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("submit_candidate_application", {
      p_job_id: input.jobId,
      p_resume_id: input.resumeId,
      p_cover_letter: input.coverLetter,
      p_answers: input.answers.map((item) => ({ question_id: item.questionId, answer: toAnswerText(item.answer) })),
    } as never);
    if (error || !data) return { success: false, error: message(error, "Unable to submit your application."), code: error?.code };
    return { success: true, data: String(data) };
  },

  async withdraw(applicationId: string): Promise<Result<true>> {
    const supabase = createClient();
    const { error } = await supabase.rpc("withdraw_candidate_application", { p_application_id: applicationId } as never);
    if (error) return { success: false, error: message(error, "Unable to withdraw your application.") };
    return { success: true, data: true };
  },

  async getSelectableResumes(): Promise<Result<SelectableResume[]>> {
    const candidate = await candidateId();
    if (!candidate.success) return candidate;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("candidate_resumes")
      .select("id, resume_name, original_file_name, created_at, updated_at, is_primary")
      .eq("candidate_id", candidate.data)
      .order("created_at", { ascending: false });
    if (error) return { success: false, error: "Unable to load resumes." };
    return {
      success: true,
      data: ((data ?? []) as ResumeRow[]).map((row) => ({
        id: row.id, label: row.resume_name, fileName: row.original_file_name ?? row.resume_name,
        updatedAt: row.updated_at, skills: [], isCurrent: row.is_primary,
      })),
    };
  },
};
