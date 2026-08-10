export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = "candidate" | "employer" | "admin";
export type JobStatus = "draft" | "active" | "paused" | "closed";
/** @deprecated legacy published/expired values mapped to active/closed in Sprint 3B */
export type LegacyJobStatus = "published" | "expired";
export type ApplicationStatus =
  | "new"
  | "reviewing"
  | "shortlisted"
  | "interview"
  | "hired"
  | "rejected";

export type InterviewStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "no_show";

export type InterviewType = "video" | "phone" | "in_person";

export type InterviewRecommendation =
  | "strong_hire"
  | "hire"
  | "maybe"
  | "no_hire";

/** @deprecated Sprint 4B maps applied→new, offer→shortlisted, withdrawn→rejected */
export type LegacyApplicationStatus =
  | "applied"
  | "offer"
  | "withdrawn";
export type AlertFrequency = "daily" | "weekly" | "instant";
export type SkillProficiency = "beginner" | "intermediate" | "advanced" | "expert";

/** @deprecated use AppRole */
export type UserRole = AppRole;
/** @deprecated legacy work mode label */
export type WorkMode = "Remote" | "Hybrid" | "Onsite";

type ProfileRow = {
  id: string;
  user_id: string;
  role: AppRole;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

type CandidateProfileRow = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  current_city: string | null;
  current_state: string | null;
  country: string | null;
  headline: string | null;
  about_me: string | null;
  years_of_experience: number;
  current_company: string | null;
  current_ctc: number | null;
  expected_ctc: number | null;
  notice_period: string | null;
  preferred_location: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  profile_photo_url: string | null;
  profile_completion: number;
  current_job_role: string | null;
  location: string | null;
  professional_summary: string | null;
  total_experience: number | null;
  expected_salary: number | null;
  currency: string | null;
  availability: string | null;
  portfolio_url: string | null;
  resume_url: string | null;
  resume_file_name: string | null;
  avatar_url: string | null;
  sap_skills: string[];
  skills: string[];
  certifications: Json;
  education: Json;
  work_experience: Json;
  languages: string[];
  created_at: string;
  updated_at: string;
};

type EmployerProfileRow = {
  id: string;
  user_id: string;
  company_name: string;
  company_logo_url: string | null;
  website: string | null;
  industry: string | null;
  company_size: string | null;
  headquarters: string | null;
  about_company: string | null;
  linkedin_url: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

type CompanyProfileRow = {
  id: string;
  user_id: string;
  company_name: string;
  logo_url: string | null;
  website: string;
  industry: string;
  company_size: string;
  country: string;
  state: string;
  city: string;
  address: string;
  about: string;
  recruiter_name: string;
  designation: string;
  work_email: string;
  phone: string;
  setup_complete: boolean;
  created_at: string;
  updated_at: string;
};

type JobRow = {
  id: string;
  company_id: string;
  employer_id: string;
  created_by: string;
  title: string;
  employment_type: string;
  job_type: string;
  experience_level: string;
  location: string;
  work_arrangement: string;
  sap_module: string;
  sap_specialization: string | null;
  sap_version: string | null;
  project_type: string | null;
  industry: string | null;
  description: string;
  responsibilities: string;
  required_skills: string;
  preferred_skills: string | null;
  minimum_experience: number;
  maximum_experience: number | null;
  salary_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  salary_visible: boolean;
  benefits: Json;
  number_of_openings: number;
  application_deadline: string | null;
  recruiter_name: string | null;
  application_email: string | null;
  application_url: string | null;
  status: JobStatus;
  published_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

type GenericTable<Row, Insert = Partial<Row> & Record<string, unknown>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: GenericTable<
        ProfileRow,
        {
          id?: string;
          user_id: string;
          role: AppRole;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      candidate_profiles: GenericTable<
        CandidateProfileRow,
        { user_id: string } & Partial<Omit<CandidateProfileRow, "user_id" | "id">> & { id?: string }
      >;
      employer_profiles: GenericTable<
        EmployerProfileRow,
        { user_id: string; company_name: string } & Partial<Omit<EmployerProfileRow, "user_id" | "company_name" | "id">> & {
          id?: string;
        }
      >;
      company_profiles: GenericTable<
        CompanyProfileRow,
        { user_id: string } & Partial<Omit<CompanyProfileRow, "user_id" | "id">> & { id?: string }
      >;
      recruiters: GenericTable<{
        id: string;
        employer_id: string;
        user_id: string;
        designation: string | null;
        is_primary: boolean;
        created_at: string;
        updated_at: string;
      }>;
      skills: GenericTable<{
        id: string;
        name: string;
        category: string | null;
        created_at: string;
        updated_at: string;
      }>;
      candidate_skills: GenericTable<{
        id: string;
        candidate_id: string;
        skill_id: string;
        experience_years: number | null;
        proficiency: SkillProficiency | null;
        created_at: string;
      }>;
      candidate_experience: GenericTable<{
        id: string;
        candidate_id: string;
        company: string;
        designation: string;
        start_date: string;
        end_date: string | null;
        currently_working: boolean;
        description: string | null;
        created_at: string;
        updated_at: string;
      }>;
      candidate_education: GenericTable<{
        id: string;
        candidate_id: string;
        degree: string;
        college: string;
        university: string | null;
        start_year: number | null;
        end_year: number | null;
        percentage: number | null;
        created_at: string;
        updated_at: string;
      }>;
      candidate_certifications: GenericTable<{
        id: string;
        candidate_id: string;
        certificate_name: string;
        issuer: string | null;
        issued_date: string | null;
        expiry_date: string | null;
        certificate_url: string | null;
        created_at: string;
        updated_at: string;
      }>;
      candidate_resumes: GenericTable<{
        id: string;
        candidate_id: string;
        resume_name: string;
        resume_url: string;
        is_primary: boolean;
        ats_score: number | null;
        created_at: string;
        updated_at: string;
      }>;
      jobs: GenericTable<
        JobRow,
        {
          company_id: string;
          employer_id: string;
          created_by: string;
          title: string;
          employment_type: string;
          job_type: string;
          experience_level: string;
          location: string;
          work_arrangement: string;
          sap_module: string;
          description: string;
          responsibilities: string;
          required_skills: string;
          minimum_experience: number;
        } & Partial<Omit<JobRow, "id">> & { id?: string }
      >;
      job_skills: GenericTable<{ id: string; job_id: string; skill_id: string }>;
      job_applications: GenericTable<{
        id: string;
        job_id: string;
        candidate_id: string;
        resume_id: string | null;
        cover_letter: string | null;
        status: ApplicationStatus;
        applied_at: string;
        updated_at: string;
        employer_notes: string | null;
        reviewed_at: string | null;
        shortlisted_at: string | null;
        interviewed_at: string | null;
        hired_at: string | null;
        rejected_at: string | null;
      }>;
      interviews: GenericTable<{
        id: string;
        application_id: string;
        scheduled_date: string;
        start_time: string;
        end_time: string;
        timezone: string;
        type: InterviewType;
        meeting_link: string | null;
        phone_number: string | null;
        location: string | null;
        notes: string | null;
        interviewers: Json;
        status: InterviewStatus;
        created_by: string;
        created_at: string;
        updated_at: string;
        cancelled_at: string | null;
        completed_at: string | null;
        no_show_at: string | null;
      }>;
      interview_feedback: GenericTable<{
        id: string;
        interview_id: string;
        overall_rating: number | null;
        technical_skills: number | null;
        communication: number | null;
        sap_knowledge: number | null;
        problem_solving: number | null;
        strengths: string | null;
        concerns: string | null;
        recommendation: InterviewRecommendation | null;
        submitted_by: string;
        submitted_at: string;
        created_at: string;
        updated_at: string;
      }>;
      conversations: GenericTable<{
        id: string;
        application_id: string;
        created_by: string;
        created_at: string;
        updated_at: string;
      }>;
      messages: GenericTable<{
        id: string;
        conversation_id: string;
        sender_id: string;
        content: string;
        created_at: string;
        read_at: string | null;
      }>;
      saved_jobs: GenericTable<{
        id: string;
        candidate_id: string;
        job_id: string;
        created_at: string;
      }>;
      job_alerts: GenericTable<Record<string, unknown>>;
      notifications: GenericTable<{
        id: string;
        user_id: string;
        title: string;
        message: string;
        type: string;
        is_read: boolean;
        created_at: string;
        updated_at: string;
      }>;
      leads: GenericTable<Record<string, unknown>>;
      feedback: GenericTable<Record<string, unknown>>;
    };
    Views: Record<string, never>;
    Functions: {
      current_app_role: { Args: Record<string, never>; Returns: AppRole };
      current_company_id: { Args: Record<string, never>; Returns: string };
      current_candidate_id: { Args: Record<string, never>; Returns: string };
      current_employer_id: { Args: Record<string, never>; Returns: string };
      owns_job: { Args: { p_job_id: string }; Returns: boolean };
      owns_application: { Args: { p_application_id: string }; Returns: boolean };
      is_application_candidate: {
        Args: { p_application_id: string };
        Returns: boolean;
      };
      map_experience_band: { Args: { band: string }; Returns: number };
      schedule_interview: {
        Args: {
          p_application_id: string;
          p_scheduled_date: string;
          p_start_time: string;
          p_end_time: string;
          p_timezone: string;
          p_type: string;
          p_meeting_link?: string | null;
          p_phone_number?: string | null;
          p_location?: string | null;
          p_notes?: string | null;
          p_interviewers?: Json;
        };
        Returns: {
          id: string;
          application_id: string;
          scheduled_date: string;
          start_time: string;
          end_time: string;
          timezone: string;
          type: InterviewType;
          meeting_link: string | null;
          phone_number: string | null;
          location: string | null;
          notes: string | null;
          interviewers: Json;
          status: InterviewStatus;
          created_by: string;
          created_at: string;
          updated_at: string;
          cancelled_at: string | null;
          completed_at: string | null;
          no_show_at: string | null;
        };
      };
      get_or_create_conversation: {
        Args: { p_application_id: string };
        Returns: {
          id: string;
          application_id: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
      };
    };
    Enums: {
      app_role: AppRole;
      job_status: JobStatus;
      application_status: ApplicationStatus;
      alert_frequency: AlertFrequency;
      skill_proficiency: SkillProficiency;
    };
    CompositeTypes: Record<string, never>;
  };
};
