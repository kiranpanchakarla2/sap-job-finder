export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = "candidate" | "employer" | "admin";
export type EmployerCompanyRole =
  | "owner"
  | "admin"
  | "recruiter"
  | "hiring_manager";
export type EmployerAccountStatus = "active" | "invited" | "suspended";
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
  is_searchable: boolean;
  work_modes: string[];
  employment_types: string[];
  discovery_status: "open_to_opportunities" | "available" | "not_available";
  employment_status: string | null;
  experience_band: string | null;
  sap_experience_band: string | null;
  current_salary_label: string | null;
  expected_salary_label: string | null;
  preferred_job_roles: string[];
  preferred_sap_modules: string[];
  preferred_locations: string[];
  preferred_salary_range: string | null;
  career_level: string | null;
  open_to_work_job_roles: string[];
  open_to_work_locations: string[];
  open_to_work_modes: string[];
  module_experience: Json;
  created_at: string;
  updated_at: string;
};

type SavedCandidateRow = {
  id: string;
  company_id: string;
  candidate_id: string;
  saved_by: string | null;
  created_at: string;
};

type EmployerShortlistedCandidateRow = {
  id: string;
  company_id: string;
  candidate_id: string;
  created_by: string | null;
  created_at: string;
};

type EmployerAccountRow = {
  id: string;
  user_id: string;
  company_id: string;
  role: EmployerCompanyRole;
  status: EmployerAccountStatus;
  can_bulk_upload?: boolean;
  created_at: string;
  updated_at: string;
};

type BulkImportDbRow = {
  id: string;
  company_id: string;
  uploaded_by: string;
  file_name: string;
  file_size: number | null;
  file_type: string;
  total_rows: number;
  selected_rows: number;
  created_count: number;
  skipped_count: number;
  failed_count: number;
  status: "processing" | "completed" | "completed_with_warnings" | "failed";
  created_at: string;
  completed_at: string | null;
  updated_at: string;
};

type BulkImportRowDbRow = {
  id: string;
  bulk_import_id: string;
  row_number: number;
  job_title: string;
  status: "created" | "skipped" | "failed";
  reason: string | null;
  job_id: string | null;
  created_at: string;
};

type SubscriptionPlanRow = {
  id: string;
  name: string;
  price_monthly: number;
  max_active_jobs: number | null;
  max_applications: number | null;
  max_talent_search: number | null;
  max_team_members: number | null;
  features: string[];
  created_at: string;
};

type SubscriptionRow = {
  id: string;
  company_id: string;
  plan_id: string;
  status: "active" | "trialing" | "past_due" | "cancelled";
  billing_cycle: "monthly" | "yearly";
  current_period_start: string;
  current_period_end: string;
  trial_ends_at: string | null;
  renewal_date: string | null;
  next_billing_date: string | null;
  payment_method_configured: boolean;
  created_at: string;
  updated_at: string;
};

type CandidatePlanRow = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price_monthly: number;
  currency: string;
  billing_cycle: "monthly" | "yearly";
  is_active: boolean;
  badge: string | null;
  highlighted: boolean;
  features: string[];
  limits: Json;
  feature_flags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type CandidateSubscriptionRow = {
  id: string;
  candidate_id: string;
  plan_id: string;
  status: "active" | "trialing" | "past_due" | "cancelled" | "expired";
  billing_cycle: "monthly" | "yearly";
  price_monthly: number;
  currency: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  renewal_date: string | null;
  created_at: string;
  updated_at: string;
};

export type CandidateSettingsRow = {
  id: string;
  candidate_id: string;
  notification_preferences: Json;
  job_preferences: Json;
  privacy_preferences: Json;
  created_at: string;
  updated_at: string;
};

type TalentSearchUsageRow = {
  id: string;
  company_id: string;
  candidate_id: string;
  created_at: string;
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
  assigned_to: string | null;
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
      employer_accounts: GenericTable<
        EmployerAccountRow,
        {
          user_id: string;
          company_id: string;
          role?: EmployerCompanyRole;
          status?: EmployerAccountStatus;
          can_bulk_upload?: boolean;
          id?: string;
        }
      >;
      bulk_imports: GenericTable<
        BulkImportDbRow,
        {
          company_id: string;
          uploaded_by: string;
          file_name: string;
          file_size?: number | null;
          file_type?: string;
          total_rows?: number;
          selected_rows?: number;
          created_count?: number;
          skipped_count?: number;
          failed_count?: number;
          status?: "processing" | "completed" | "completed_with_warnings" | "failed";
          id?: string;
        }
      >;
      bulk_import_rows: GenericTable<
        BulkImportRowDbRow,
        {
          bulk_import_id: string;
          row_number: number;
          job_title: string;
          status: "created" | "skipped" | "failed";
          reason?: string | null;
          job_id?: string | null;
          id?: string;
        }
      >;
      employer_invitations: GenericTable<
        {
          id: string;
          company_id: string;
          email: string;
          role: Exclude<EmployerCompanyRole, "owner">;
          invited_by: string | null;
          status: "pending" | "accepted" | "cancelled" | "expired";
          expires_at: string;
          created_at: string;
          updated_at: string;
        },
        {
          company_id: string;
          email: string;
          role: Exclude<EmployerCompanyRole, "owner">;
          invited_by?: string | null;
          status?: "pending" | "accepted" | "cancelled" | "expired";
          expires_at?: string;
          id?: string;
        }
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
        location: string | null;
        employment_type: string | null;
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
        field_of_study: string | null;
        location: string | null;
        grade: string | null;
        start_year: number | null;
        end_year: number | null;
        start_date: string | null;
        end_date: string | null;
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
        credential_id: string | null;
        status: string;
        created_at: string;
        updated_at: string;
      }>;
      candidate_resumes: GenericTable<{
        id: string;
        candidate_id: string;
        resume_name: string;
        resume_url: string;
        storage_path: string | null;
        file_size: number | null;
        mime_type: string | null;
        file_type: string | null;
        original_file_name: string | null;
        version_number: number | null;
        is_primary: boolean;
        ats_score: number | null;
        created_at: string;
        updated_at: string;
      }>;
      candidate_career_highlights: GenericTable<{
        id: string;
        candidate_id: string;
        content: string;
        display_order: number;
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
        withdrawn_at: string | null;
      }>;
      job_application_questions: GenericTable<{
        id: string;
        job_id: string;
        question: string;
        question_type: "text" | "textarea" | "number" | "yes_no" | "single_select" | "multiple_select";
        required: boolean;
        options: Json | null;
        display_order: number;
        created_at: string;
      }>;
      application_answers: GenericTable<{
        id: string;
        application_id: string;
        question_id: string;
        answer: string | null;
        created_at: string;
        updated_at: string;
      }>;
      application_status_history: GenericTable<{
        id: string;
        application_id: string;
        status: string;
        created_at: string;
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
      saved_jobs: GenericTable<
        {
          id: string;
          candidate_id: string;
          job_id: string;
          created_at: string;
        },
        {
          candidate_id: string;
          job_id: string;
          id?: string;
          created_at?: string;
        }
      >;
      saved_candidates: GenericTable<
        SavedCandidateRow,
        {
          company_id: string;
          candidate_id: string;
          saved_by?: string | null;
          id?: string;
          created_at?: string;
        }
      >;
      employer_shortlisted_candidates: GenericTable<
        EmployerShortlistedCandidateRow,
        {
          company_id: string;
          candidate_id: string;
          created_by?: string | null;
          id?: string;
          created_at?: string;
        }
      >;
      subscription_plans: GenericTable<SubscriptionPlanRow>;
      subscriptions: GenericTable<
        SubscriptionRow,
        {
          company_id: string;
          plan_id: string;
          id?: string;
          status?: SubscriptionRow["status"];
          billing_cycle?: SubscriptionRow["billing_cycle"];
          current_period_start?: string;
          current_period_end?: string;
          trial_ends_at?: string | null;
          renewal_date?: string | null;
          next_billing_date?: string | null;
          payment_method_configured?: boolean;
        }
      >;
      candidate_plans: GenericTable<CandidatePlanRow>;
      candidate_subscriptions: GenericTable<
        CandidateSubscriptionRow,
        {
          candidate_id: string;
          plan_id: string;
          id?: string;
          status?: CandidateSubscriptionRow["status"];
          billing_cycle?: CandidateSubscriptionRow["billing_cycle"];
          price_monthly?: number;
          currency?: string;
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          renewal_date?: string | null;
        }
      >;
      candidate_settings: GenericTable<
        CandidateSettingsRow,
        {
          candidate_id: string;
          notification_preferences?: Json;
          job_preferences?: Json;
          privacy_preferences?: Json;
          id?: string;
          created_at?: string;
          updated_at?: string;
        },
        Partial<{
          notification_preferences: Json;
          job_preferences: Json;
          privacy_preferences: Json;
          updated_at: string;
        }>
      >;
      talent_search_usage: GenericTable<TalentSearchUsageRow>;
      job_alerts: GenericTable<
        {
          id: string;
          candidate_id: string;
          name: string;
          keywords: string[];
          location: string | null;
          experience_min: number | null;
          experience_max: number | null;
          experience: string | null;
          sap_module: string | null;
          sap_modules: string[];
          work_mode: string | null;
          employment_type: string | null;
          salary_min: number | null;
          salary_max: number | null;
          frequency: AlertFrequency;
          is_active: boolean;
          last_matched_count: number;
          created_at: string;
          updated_at: string;
        },
        {
          candidate_id: string;
          name: string;
          keywords?: string[];
          location?: string | null;
          experience_min?: number | null;
          experience_max?: number | null;
          experience?: string | null;
          sap_module?: string | null;
          sap_modules?: string[];
          work_mode?: string | null;
          employment_type?: string | null;
          salary_min?: number | null;
          salary_max?: number | null;
          frequency?: AlertFrequency;
          is_active?: boolean;
          last_matched_count?: number;
          id?: string;
          created_at?: string;
          updated_at?: string;
        },
        Partial<{
          name: string;
          keywords: string[];
          location: string | null;
          experience_min: number | null;
          experience_max: number | null;
          experience: string | null;
          sap_module: string | null;
          sap_modules: string[];
          work_mode: string | null;
          employment_type: string | null;
          salary_min: number | null;
          salary_max: number | null;
          frequency: AlertFrequency;
          is_active: boolean;
          last_matched_count: number;
          updated_at: string;
        }>
      >;
      notifications: GenericTable<{
        id: string;
        user_id: string;
        title: string;
        description: string;
        message?: string | null;
        type: string;
        is_read?: boolean;
        read_at: string | null;
        priority: "normal" | "important";
        related_entity_type: string | null;
        related_entity_id: string | null;
        action_url: string | null;
        action_label: string | null;
        metadata: Json;
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
      submit_candidate_application: {
        Args: { p_job_id: string; p_resume_id: string | null; p_cover_letter: string; p_answers?: Json };
        Returns: string;
      };
      bulk_import_jobs: {
        Args: { p_jobs: Json; p_metadata?: Json };
        Returns: Json;
      };
      update_team_member_bulk_upload_permission: {
        Args: { p_account_id: string; p_can_bulk_upload: boolean };
        Returns: Json;
      };
      withdraw_candidate_application: { Args: { p_application_id: string }; Returns: undefined };
      set_candidate_resume_primary: {
        Args: { p_resume_id: string };
        Returns: {
          id: string;
          candidate_id: string;
          resume_name: string;
          resume_url: string;
          storage_path: string | null;
          file_size: number | null;
          mime_type: string | null;
          file_type: string | null;
          original_file_name: string | null;
          version_number: number | null;
          is_primary: boolean;
          ats_score: number | null;
          created_at: string;
          updated_at: string;
        };
      };
      current_employer_id: { Args: Record<string, never>; Returns: string };
      get_current_employer_account_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_current_employer_role: {
        Args: Record<string, never>;
        Returns: EmployerCompanyRole;
      };
      is_company_owner_or_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      can_access_job: { Args: { p_job_id: string }; Returns: boolean };
      can_manage_job: { Args: { p_job_id: string }; Returns: boolean };
      owns_job: { Args: { p_job_id: string }; Returns: boolean };
      owns_application: { Args: { p_application_id: string }; Returns: boolean };
      is_application_candidate: {
        Args: { p_application_id: string };
        Returns: boolean;
      };
      map_experience_band: { Args: { band: string }; Returns: number };
      search_talent_candidates: {
        Args: {
          p_keyword?: string | null;
          p_modules?: string[] | null;
          p_skills?: string[] | null;
          p_experience_bands?: string[] | null;
          p_experience_min?: number | null;
          p_countries?: string[] | null;
          p_location_query?: string | null;
          p_work_modes?: string[] | null;
          p_employment_types?: string[] | null;
          p_availability?: string[] | null;
          p_candidate_status?: string[] | null;
          p_certifications?: string[] | null;
          p_languages?: string[] | null;
          p_sort?: string | null;
          p_page?: number | null;
          p_page_size?: number | null;
        };
        Returns: Json;
      };
      get_talent_candidate: {
        Args: { p_candidate_id: string };
        Returns: Json;
      };
      save_talent_candidate: {
        Args: { p_candidate_id: string };
        Returns: Json;
      };
      remove_saved_talent_candidate: {
        Args: { p_candidate_id: string };
        Returns: Json;
      };
      list_saved_talent_candidates: {
        Args: Record<string, never>;
        Returns: Json;
      };
      shortlist_talent_candidate: {
        Args: { p_candidate_id: string };
        Returns: Json;
      };
      remove_shortlisted_talent_candidate: {
        Args: { p_candidate_id: string };
        Returns: Json;
      };
      list_shortlisted_talent_candidate_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      get_talent_search_usage: {
        Args: Record<string, never>;
        Returns: Json;
      };
      list_company_team_members: {
        Args: Record<string, never>;
        Returns: Json;
      };
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
      get_candidate_effective_plan: {
        Args: { p_candidate_id: string };
        Returns: string;
      };
      get_candidate_active_job_alert_limit: {
        Args: { p_candidate_id: string };
        Returns: number | null;
      };
      get_candidate_subscription_overview: {
        Args: Record<string, never>;
        Returns: Json;
      };
      dev_set_candidate_subscription: {
        Args: {
          p_plan_id: string;
          p_status?: string;
          p_cancel_at_period_end?: boolean;
          p_days_remaining?: number;
        };
        Returns: Json;
      };
      delete_candidate_account: {
        Args: Record<string, never>;
        Returns: Json;
      };
      delete_employer_account: {
        Args: Record<string, never>;
        Returns: Json;
      };
    };
    Enums: {
      app_role: AppRole;
      employer_company_role: EmployerCompanyRole;
      employer_account_status: EmployerAccountStatus;
      job_status: JobStatus;
      application_status: ApplicationStatus;
      alert_frequency: AlertFrequency;
      skill_proficiency: SkillProficiency;
    };
    CompositeTypes: Record<string, never>;
  };
};
