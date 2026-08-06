export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "CANDIDATE" | "RECRUITER" | "ADMIN";
export type JobStatus = "draft" | "published" | "closed";
export type WorkMode = "Remote" | "Hybrid" | "Onsite";
export type ApplicationStatus =
  | "applied"
  | "reviewing"
  | "shortlisted"
  | "interview"
  | "rejected"
  | "hired";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          location: string | null;
          headline: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          location?: string | null;
          headline?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      candidate_profiles: {
        Row: {
          user_id: string;
          experience_years: number | null;
          skills: string[];
          education: Json | null;
          certifications: Json | null;
          summary: string | null;
          completion_percent: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          experience_years?: number | null;
          skills?: string[];
          education?: Json | null;
          certifications?: Json | null;
          summary?: string | null;
          completion_percent?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["candidate_profiles"]["Insert"]>;
        Relationships: [];
      };
      resumes: {
        Row: {
          id: string;
          user_id: string;
          storage_path: string;
          filename: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          storage_path: string;
          filename: string;
          uploaded_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["resumes"]["Insert"]>;
        Relationships: [];
      };
      companies: {
        Row: {
          id: string;
          name: string;
          logo: string | null;
          description: string | null;
          website: string | null;
          location: string | null;
          owner_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          logo?: string | null;
          description?: string | null;
          website?: string | null;
          location?: string | null;
          owner_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          title: string;
          company_id: string;
          location: string | null;
          salary_min: number | null;
          salary_max: number | null;
          experience_years: number | null;
          work_mode: WorkMode;
          module: string | null;
          skills: string[];
          description: string | null;
          requirements: string[];
          benefits: string[];
          featured: boolean;
          status: JobStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          company_id: string;
          location?: string | null;
          salary_min?: number | null;
          salary_max?: number | null;
          experience_years?: number | null;
          work_mode?: WorkMode;
          module?: string | null;
          skills?: string[];
          description?: string | null;
          requirements?: string[];
          benefits?: string[];
          featured?: boolean;
          status?: JobStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["jobs"]["Insert"]>;
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          job_id: string;
          candidate_id: string;
          status: ApplicationStatus;
          applied_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          candidate_id: string;
          status?: ApplicationStatus;
          applied_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["applications"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      job_status: JobStatus;
      work_mode: WorkMode;
      application_status: ApplicationStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
