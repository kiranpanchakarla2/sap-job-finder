/**
 * Company-scoped employer permissions (UX layer).
 *
 * Source of truth for security remains Supabase RLS + helpers:
 *   auth.uid() → employer_accounts → company_id + role
 *
 * Platform role (profiles.role: candidate|employer|admin) gates portal access.
 * Company role (employer_accounts.role) gates actions within a company.
 */

export const EMPLOYER_COMPANY_ROLES = [
  "owner",
  "admin",
  "recruiter",
  "hiring_manager",
] as const;

export type EmployerCompanyRole = (typeof EMPLOYER_COMPANY_ROLES)[number];

export const EMPLOYER_ACCOUNT_STATUSES = [
  "active",
  "invited",
  "suspended",
] as const;

export type EmployerAccountStatus = (typeof EMPLOYER_ACCOUNT_STATUSES)[number];

export type EmployerMembership = {
  accountId: string;
  companyId: string;
  role: EmployerCompanyRole;
  status: EmployerAccountStatus;
};

export function isEmployerCompanyRole(
  value: unknown,
): value is EmployerCompanyRole {
  return (
    typeof value === "string" &&
    (EMPLOYER_COMPANY_ROLES as readonly string[]).includes(value)
  );
}

export function isActiveMembership(
  membership: EmployerMembership | null | undefined,
): membership is EmployerMembership {
  return Boolean(membership && membership.status === "active");
}

export function isOwnerOrAdmin(role: EmployerCompanyRole | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export function canManageCompanyProfile(
  role: EmployerCompanyRole | null | undefined,
): boolean {
  return isOwnerOrAdmin(role);
}

export function canReadCompanyProfile(
  role: EmployerCompanyRole | null | undefined,
): boolean {
  return role != null;
}

export function canManageEmployerAccounts(
  role: EmployerCompanyRole | null | undefined,
): boolean {
  return isOwnerOrAdmin(role);
}

export function canAccessTalentSearch(
  role: EmployerCompanyRole | null | undefined,
): boolean {
  // V1: all active company roles may use Talent Search (company-scoped).
  // Safer HM-only discovery can be tightened later without schema changes.
  return role != null;
}

export function canManageSubscription(
  role: EmployerCompanyRole | null | undefined,
): boolean {
  return isOwnerOrAdmin(role);
}

export function canReadSubscription(
  role: EmployerCompanyRole | null | undefined,
): boolean {
  return role === "owner" || role === "admin" || role === "recruiter";
}

export function canCreateJob(
  role: EmployerCompanyRole | null | undefined,
): boolean {
  return role === "owner" || role === "admin" || role === "recruiter";
}

export function canManageAllCompanyJobs(
  role: EmployerCompanyRole | null | undefined,
): boolean {
  return isOwnerOrAdmin(role);
}

/** Recruiter: own jobs (created_by = auth user). Owner/Admin: all. */
export function canManageJob(params: {
  role: EmployerCompanyRole | null | undefined;
  jobCreatedByUserId: string;
  currentUserId: string;
}): boolean {
  const { role, jobCreatedByUserId, currentUserId } = params;
  if (!role) return false;
  if (isOwnerOrAdmin(role)) return true;
  if (role === "recruiter") return jobCreatedByUserId === currentUserId;
  return false;
}

/** Hiring Manager: assigned jobs only. Owner/Admin/Recruiter: via canAccessJob. */
export function canAccessJob(params: {
  role: EmployerCompanyRole | null | undefined;
  jobCreatedByUserId: string;
  currentUserId: string;
  assignedToAccountId: string | null;
  currentAccountId: string | null;
}): boolean {
  const {
    role,
    jobCreatedByUserId,
    currentUserId,
    assignedToAccountId,
    currentAccountId,
  } = params;
  if (!role) return false;
  if (isOwnerOrAdmin(role)) return true;
  if (role === "recruiter") return jobCreatedByUserId === currentUserId;
  if (role === "hiring_manager") {
    return Boolean(
      assignedToAccountId &&
        currentAccountId &&
        assignedToAccountId === currentAccountId,
    );
  }
  return false;
}

export function canManageApplicationsForJob(params: {
  role: EmployerCompanyRole | null | undefined;
  jobCreatedByUserId: string;
  currentUserId: string;
  assignedToAccountId: string | null;
  currentAccountId: string | null;
}): boolean {
  return canAccessJob(params);
}

export function canViewCompanyAnalytics(
  role: EmployerCompanyRole | null | undefined,
): boolean {
  return isOwnerOrAdmin(role);
}

export function canViewRecruiterAnalytics(
  role: EmployerCompanyRole | null | undefined,
): boolean {
  return role === "recruiter" || isOwnerOrAdmin(role);
}
