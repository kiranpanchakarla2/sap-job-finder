import type {
  EmployerInterview,
  InterviewFeedback,
  Interviewer,
  InterviewRecommendation,
  InterviewStatus,
  InterviewType,
} from "../types/interview.types";

export type InterviewFeedbackRow = {
  overall_rating: number | null;
  technical_skills: number | null;
  communication: number | null;
  sap_knowledge: number | null;
  problem_solving: number | null;
  strengths: string | null;
  concerns: string | null;
  recommendation: string | null;
  submitted_at: string;
};

export type InterviewJoinRow = {
  id: string;
  application_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  type: string;
  meeting_link: string | null;
  phone_number: string | null;
  location: string | null;
  notes: string | null;
  interviewers: unknown;
  status: string;
  created_at: string;
  updated_at: string;
  interview_feedback?: InterviewFeedbackRow[] | InterviewFeedbackRow | null;
  job_applications: {
    id: string;
    status: string;
    candidate_id: string;
    jobs: {
      id: string;
      title: string;
      sap_module: string | null;
      location: string | null;
      employment_type: string | null;
    } | null;
    candidate_profiles: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      current_job_role: string | null;
      headline: string | null;
      avatar_url: string | null;
      profile_photo_url: string | null;
      total_experience: number | null;
      years_of_experience: number | null;
      sap_skills: string[] | null;
      location: string | null;
      current_city: string | null;
    } | null;
  } | null;
};

export const INTERVIEW_SELECT = `
  id,
  application_id,
  scheduled_date,
  start_time,
  end_time,
  timezone,
  type,
  meeting_link,
  phone_number,
  location,
  notes,
  interviewers,
  status,
  created_at,
  updated_at,
  interview_feedback (
    overall_rating,
    technical_skills,
    communication,
    sap_knowledge,
    problem_solving,
    strengths,
    concerns,
    recommendation,
    submitted_at
  ),
  job_applications!inner (
    id,
    status,
    candidate_id,
    jobs (
      id,
      title,
      sap_module,
      location,
      employment_type
    ),
    candidate_profiles (
      id,
      first_name,
      last_name,
      current_job_role,
      headline,
      avatar_url,
      profile_photo_url,
      total_experience,
      years_of_experience,
      sap_skills,
      location,
      current_city
    )
  )
`;

function asSingle<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizeTime(value: string): string {
  // Postgres time may come as HH:MM:SS or HH:MM:SS.sss
  return value.slice(0, 5);
}

export function mapInterviewers(raw: unknown): Interviewer[] {
  if (!Array.isArray(raw)) return [];
  const mapped: Interviewer[] = [];
  raw.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") return;
    const record = entry as { name?: unknown; email?: unknown; id?: unknown };
    const name = typeof record.name === "string" ? record.name.trim() : "";
    if (!name) return;
    const email =
      typeof record.email === "string" ? record.email.trim() : null;
    const id =
      typeof record.id === "string" && record.id
        ? record.id
        : `ivw_${index}_${name.toLowerCase().replace(/\s+/g, "_")}`;
    mapped.push({ id, name, email });
  });
  return mapped;
}

export function interviewersToJson(interviewers: Interviewer[]) {
  return interviewers.map((person) => ({
    name: person.name,
    email: person.email ?? null,
  }));
}

function mapFeedback(
  raw: InterviewFeedbackRow[] | InterviewFeedbackRow | null | undefined,
): InterviewFeedback | null {
  const row = asSingle(raw);
  if (!row) return null;
  return {
    overallRating: row.overall_rating ?? 0,
    technicalSkills: row.technical_skills ?? 0,
    communication: row.communication ?? 0,
    sapKnowledge: row.sap_knowledge ?? 0,
    problemSolving: row.problem_solving ?? 0,
    strengths: row.strengths ?? "",
    concerns: row.concerns ?? "",
    recommendation: (row.recommendation ?? "maybe") as InterviewRecommendation,
    submittedAt: row.submitted_at,
  };
}

export function mapInterviewRow(row: InterviewJoinRow): EmployerInterview {
  const application = asSingle(row.job_applications);
  const job = asSingle(application?.jobs ?? null);
  const candidate = asSingle(application?.candidate_profiles ?? null);
  const first = candidate?.first_name?.trim() ?? "";
  const last = candidate?.last_name?.trim() ?? "";
  const name = `${first} ${last}`.trim() || "Candidate";

  return {
    id: row.id,
    applicationId: row.application_id,
    candidateId: candidate?.id ?? application?.candidate_id ?? "",
    candidateName: name,
    candidateAvatarUrl: candidate?.avatar_url ?? candidate?.profile_photo_url ?? null,
    candidateRole:
      candidate?.current_job_role?.trim() ||
      candidate?.headline?.trim() ||
      "SAP Professional",
    candidateExperienceYears: Number(
      candidate?.total_experience ?? candidate?.years_of_experience ?? 0,
    ),
    candidateSapSkills: candidate?.sap_skills ?? [],
    candidateLocation:
      candidate?.location?.trim() ||
      candidate?.current_city?.trim() ||
      "—",
    jobId: job?.id ?? "",
    jobTitle: job?.title ?? "Role",
    sapModule: job?.sap_module ?? "—",
    jobLocation: job?.location ?? "—",
    employmentType: job?.employment_type ?? "—",
    scheduledDate: row.scheduled_date,
    startTime: normalizeTime(row.start_time),
    endTime: normalizeTime(row.end_time),
    timezone: row.timezone || "UTC",
    type: row.type as InterviewType,
    meetingLink: row.meeting_link,
    phoneNumber: row.phone_number,
    location: row.location,
    interviewers: mapInterviewers(row.interviewers),
    notes: row.notes ?? "",
    status: row.status as InterviewStatus,
    feedback: mapFeedback(row.interview_feedback),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function normalizeInterviewJoinRow(
  row: Record<string, unknown>,
): InterviewJoinRow {
  const applications = Array.isArray(row.job_applications)
    ? row.job_applications[0]
    : row.job_applications;
  const appRecord = (applications ?? null) as Record<string, unknown> | null;
  const jobs = appRecord
    ? Array.isArray(appRecord.jobs)
      ? appRecord.jobs[0]
      : appRecord.jobs
    : null;
  const profiles = appRecord
    ? Array.isArray(appRecord.candidate_profiles)
      ? appRecord.candidate_profiles[0]
      : appRecord.candidate_profiles
    : null;

  const base = row as unknown as InterviewJoinRow;

  if (!appRecord || typeof appRecord.id !== "string") {
    return { ...base, job_applications: null };
  }

  return {
    ...base,
    job_applications: {
      id: appRecord.id,
      status: String(appRecord.status ?? "new"),
      candidate_id: String(appRecord.candidate_id ?? ""),
      jobs: (jobs as InterviewJoinRow["job_applications"] extends null
        ? never
        : NonNullable<InterviewJoinRow["job_applications"]>["jobs"]) ?? null,
      candidate_profiles:
        (profiles as InterviewJoinRow["job_applications"] extends null
          ? never
          : NonNullable<
              InterviewJoinRow["job_applications"]
            >["candidate_profiles"]) ?? null,
    },
  };
}
