export type InterviewStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "no_show";

export type InterviewType = "video" | "phone" | "in_person";

export type InterviewTabFilter =
  | "all"
  | "upcoming"
  | "today"
  | "completed"
  | "cancelled";

export type InterviewRecommendation =
  | "strong_hire"
  | "hire"
  | "maybe"
  | "no_hire";

export type InterviewFeedback = {
  overallRating: number;
  technicalSkills: number;
  communication: number;
  sapKnowledge: number;
  problemSolving: number;
  strengths: string;
  concerns: string;
  recommendation: InterviewRecommendation;
  submittedAt: string;
};

export type Interviewer = {
  id: string;
  name: string;
  email?: string | null;
};

export type EmployerInterview = {
  id: string;
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateAvatarUrl: string | null;
  candidateRole: string;
  candidateExperienceYears: number;
  candidateSapSkills: string[];
  candidateLocation: string;
  jobId: string;
  jobTitle: string;
  sapModule: string;
  jobLocation: string;
  employmentType: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
  type: InterviewType;
  meetingLink: string | null;
  phoneNumber: string | null;
  location: string | null;
  interviewers: Interviewer[];
  notes: string;
  status: InterviewStatus;
  feedback: InterviewFeedback | null;
  createdAt: string;
  updatedAt: string;
};

export type InterviewSummaryStats = {
  upcoming: number;
  today: number;
  completed: number;
  cancelled: number;
};

export type ScheduleInterviewInput = {
  applicationId: string;
  /** Denormalized fields from form selection (not persisted). */
  candidateId?: string;
  candidateName?: string;
  candidateAvatarUrl?: string | null;
  candidateRole?: string;
  candidateExperienceYears?: number;
  candidateSapSkills?: string[];
  candidateLocation?: string;
  jobId?: string;
  jobTitle?: string;
  sapModule?: string;
  jobLocation?: string;
  employmentType?: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  type: InterviewType;
  meetingLink?: string;
  phoneNumber?: string;
  location?: string;
  interviewers: Interviewer[];
  notes?: string;
};

export type UpdateInterviewInput = {
  scheduledDate: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  type: InterviewType;
  meetingLink?: string;
  phoneNumber?: string;
  location?: string;
  interviewers: Interviewer[];
  notes?: string;
};

export type SaveFeedbackInput = {
  overallRating: number;
  technicalSkills: number;
  communication: number;
  sapKnowledge: number;
  problemSolving: number;
  strengths: string;
  concerns: string;
  recommendation: InterviewRecommendation;
};

export type ShortlistedCandidateOption = {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateAvatarUrl: string | null;
  candidateRole: string;
  candidateExperienceYears: number;
  candidateSapSkills: string[];
  candidateLocation: string;
  jobId: string;
  jobTitle: string;
  sapModule: string;
  jobLocation: string;
  employmentType: string;
  applicationStatus: "shortlisted" | "interview";
};

export type InterviewServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
