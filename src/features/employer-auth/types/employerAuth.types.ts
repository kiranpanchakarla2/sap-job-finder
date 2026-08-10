/**
 * Employer authentication types (Sprint 1 — Supabase-backed).
 */

import type { Session } from "@supabase/supabase-js";

export type EmployerRole = "employer";

export type Employer = {
  id: string;
  role: EmployerRole;
  email: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
};

export type EmployerProfile = {
  id: string;
  user_id: string;
  role: EmployerRole;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
};

export type EmployerRegistrationData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  jobTitle?: string;
};

export type EmployerLoginData = {
  email: string;
  password: string;
};

export type EmployerForgotPasswordData = {
  email: string;
};

export type EmployerResetPasswordData = {
  password: string;
  confirmPassword: string;
};

export type AuthState = {
  employer: Employer | null;
  profile: EmployerProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isEmployer: boolean;
  isLoading: boolean;
  pendingVerificationEmail: string | null;
};

export type AuthResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export type EmployerAuthSuccess = {
  employer: Employer;
  profile: EmployerProfile | null;
};
