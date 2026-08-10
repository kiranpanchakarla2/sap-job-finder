import type {
  ApplicationStatus,
  ApplicationTimelineEvent,
  EducationItem,
  EmployerApplication,
  WorkExperienceItem,
} from "../types/application.types";

export type DbCertification = {
  name?: string;
  issuer?: string;
  year?: string | number;
};

export type DbEducation = {
  degree?: string;
  institution?: string;
  college?: string;
  year?: string | number;
  end_year?: string | number;
};

export type DbWorkExperience = {
  id?: string;
  company?: string;
  role?: string;
  designation?: string;
  start_date?: string;
  end_date?: string | null;
  duration?: string;
  description?: string;
};

export type ApplicationJoinRow = {
  id: string;
  job_id: string;
  candidate_id: string;
  cover_letter: string | null;
  status: string;
  applied_at: string;
  updated_at: string;
  reviewed_at: string | null;
  shortlisted_at: string | null;
  interviewed_at: string | null;
  hired_at: string | null;
  rejected_at: string | null;
  employer_notes: string | null;
  jobs: {
    id: string;
    title: string;
    sap_module: string | null;
    location: string | null;
    employment_type: string | null;
    work_arrangement: string | null;
    status: string;
  } | null;
  candidate_profiles: {
    id: string;
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    headline: string | null;
    current_job_role: string | null;
    location: string | null;
    current_city: string | null;
    professional_summary: string | null;
    about_me: string | null;
    total_experience: number | null;
    years_of_experience: number | null;
    expected_salary: number | null;
    expected_ctc: number | null;
    currency: string | null;
    notice_period: string | null;
    availability: string | null;
    avatar_url: string | null;
    profile_photo_url: string | null;
    resume_url: string | null;
    resume_file_name: string | null;
    sap_skills: string[] | null;
    skills: string[] | null;
    certifications: DbCertification[] | unknown;
    education: DbEducation[] | unknown;
    work_experience: DbWorkExperience[] | unknown;
    languages: string[] | null;
  } | null;
};

const VALID_STATUSES: ApplicationStatus[] = [
  "new",
  "reviewing",
  "shortlisted",
  "interview",
  "hired",
  "rejected",
];

export function normalizeApplicationStatus(value: string): ApplicationStatus {
  if (value === "applied") return "new";
  if (value === "offer") return "shortlisted";
  if (value === "withdrawn") return "rejected";
  if (VALID_STATUSES.includes(value as ApplicationStatus)) {
    return value as ApplicationStatus;
  }
  return "new";
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function formatDuration(start?: string, end?: string | null): string {
  if (!start) return "";
  const startLabel = start.slice(0, 7);
  if (!end) return `${startLabel} – Present`;
  return `${startLabel} – ${end.slice(0, 7)}`;
}

function mapEducation(raw: unknown): EducationItem[] {
  return asArray<DbEducation>(raw).map((item, index) => ({
    id: `edu_${index}`,
    degree: item.degree ?? "—",
    institution: item.institution ?? item.college ?? "—",
    year: String(item.year ?? item.end_year ?? ""),
  }));
}

function mapWorkExperience(raw: unknown): WorkExperienceItem[] {
  return asArray<DbWorkExperience>(raw).map((item, index) => ({
    id: item.id ?? `wx_${index}`,
    role: item.role ?? item.designation ?? "—",
    company: item.company ?? "—",
    duration:
      item.duration ||
      formatDuration(item.start_date, item.end_date) ||
      "—",
    description: item.description ?? "",
  }));
}

function mapCertifications(raw: unknown): string[] {
  return asArray<DbCertification>(raw)
    .map((item) => {
      if (typeof item === "string") return item;
      const name = item.name?.trim();
      if (!name) return "";
      const issuer = item.issuer?.trim();
      const year = item.year != null ? String(item.year) : "";
      return [name, issuer, year].filter(Boolean).join(" · ");
    })
    .filter(Boolean);
}

function formatSalary(
  amount: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (amount == null) return "Not specified";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency ?? ""} ${amount}`.trim();
  }
}

export function buildTimeline(row: ApplicationJoinRow): ApplicationTimelineEvent[] {
  const events: ApplicationTimelineEvent[] = [
    {
      id: `${row.id}_applied`,
      label: "Applied",
      date: row.applied_at,
      status: "applied",
      completed: true,
    },
  ];

  if (row.reviewed_at) {
    events.push({
      id: `${row.id}_reviewed`,
      label: "Application reviewed",
      date: row.reviewed_at,
      status: "reviewing",
      completed: true,
    });
  }
  if (row.shortlisted_at) {
    events.push({
      id: `${row.id}_shortlisted`,
      label: "Shortlisted",
      date: row.shortlisted_at,
      status: "shortlisted",
      completed: true,
    });
  }
  if (row.interviewed_at) {
    events.push({
      id: `${row.id}_interview`,
      label: "Interview scheduled",
      date: row.interviewed_at,
      status: "interview",
      completed: true,
    });
  }
  if (row.hired_at) {
    events.push({
      id: `${row.id}_hired`,
      label: "Hired",
      date: row.hired_at,
      status: "hired",
      completed: true,
    });
  }
  if (row.rejected_at) {
    events.push({
      id: `${row.id}_rejected`,
      label: "Rejected",
      date: row.rejected_at,
      status: "rejected",
      completed: true,
    });
  }

  return events.sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return aTime - bTime;
  });
}

export function mapApplicationRow(row: ApplicationJoinRow): EmployerApplication {
  const candidate = row.candidate_profiles;
  const job = row.jobs;
  const firstName = candidate?.first_name?.trim() ?? "";
  const lastName = candidate?.last_name?.trim() ?? "";
  const candidateName =
    [firstName, lastName].filter(Boolean).join(" ") || "Candidate";

  const experienceYears = Number(
    candidate?.total_experience ?? candidate?.years_of_experience ?? 0,
  );

  return {
    id: row.id,
    candidateId: row.candidate_id,
    candidateName,
    avatarUrl: candidate?.avatar_url ?? candidate?.profile_photo_url ?? null,
    email: "",
    phone: candidate?.phone ?? "",
    location:
      candidate?.location ||
      candidate?.current_city ||
      "Location not specified",
    currentRole:
      candidate?.current_job_role ||
      candidate?.headline ||
      "SAP Professional",
    experienceYears: Number.isFinite(experienceYears) ? experienceYears : 0,
    sapSkills: candidate?.sap_skills ?? [],
    certifications: mapCertifications(candidate?.certifications),
    education: mapEducation(candidate?.education),
    languages: candidate?.languages ?? [],
    summary:
      candidate?.professional_summary ||
      candidate?.about_me ||
      "No professional summary provided.",
    workExperience: mapWorkExperience(candidate?.work_experience),
    availability: candidate?.availability || "Not specified",
    expectedSalary: formatSalary(
      candidate?.expected_salary ?? candidate?.expected_ctc,
      candidate?.currency,
    ),
    noticePeriod: candidate?.notice_period || "Not specified",
    appliedJobId: row.job_id,
    appliedJobTitle: job?.title ?? "Unknown role",
    sapModule: job?.sap_module ?? "—",
    jobLocation: job?.location ?? "—",
    employmentType: job?.employment_type ?? "—",
    workArrangement: job?.work_arrangement ?? "—",
    applicationDate: row.applied_at,
    updatedAt: row.updated_at,
    status: normalizeApplicationStatus(row.status),
    resumeName: candidate?.resume_file_name ?? null,
    resumePath: candidate?.resume_url ?? null,
    coverLetter: row.cover_letter,
    timeline: buildTimeline(row),
    notes: row.employer_notes,
  };
}

export const APPLICATION_SELECT = `
  id,
  job_id,
  candidate_id,
  cover_letter,
  status,
  applied_at,
  updated_at,
  reviewed_at,
  shortlisted_at,
  interviewed_at,
  hired_at,
  rejected_at,
  employer_notes,
  jobs (
    id,
    title,
    sap_module,
    location,
    employment_type,
    work_arrangement,
    status
  ),
  candidate_profiles (
    id,
    user_id,
    first_name,
    last_name,
    phone,
    headline,
    current_job_role,
    location,
    current_city,
    professional_summary,
    about_me,
    total_experience,
    years_of_experience,
    expected_salary,
    expected_ctc,
    currency,
    notice_period,
    availability,
    avatar_url,
    profile_photo_url,
    resume_url,
    resume_file_name,
    sap_skills,
    skills,
    certifications,
    education,
    work_experience,
    languages
  )
`;
