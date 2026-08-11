export {
  getAuthErrorMessage,
  getVerificationLinkErrorMessage,
} from "./errors";
export {
  getSignedInHomePath,
  getSignedInRole,
  signInWithEmail,
  signOutClient,
  signUpWithEmail,
} from "./client";
export {
  requireAdminUser,
  requireCandidateUser,
  requireInstitutionUser,
  requirePublicUser,
  requireRecruiterUser,
  requireUser,
} from "./session";
export type { AuthUser } from "./session";
export {
  canAccessAdmin,
  canAccessInstitutionDashboard,
  canAccessPath,
  canAccessPublicDashboard,
  canAccessRecruiter,
  getHomePathForRole,
  getLoginPathForPlatform,
  getPlatformForRole,
  isAdminRole,
  isCandidateRole,
  isInstitutionRole,
  isPublicRole,
  isRecruiterRole,
  isUserRole,
  resolveRoleFromAppMetadata,
  resolveRoleFromClaims,
  DEFAULT_PUBLIC_ROLE,
  INSTITUTION_ROLES,
  PUBLIC_ROLES,
  USER_ROLES,
} from "./roles";
export type { Platform, UserRole } from "./roles";
export {
  EMPLOYER_ACCOUNT_STATUSES,
  EMPLOYER_COMPANY_ROLES,
  canAccessJob,
  canAccessTalentSearch,
  canCreateJob,
  canManageAllCompanyJobs,
  canManageApplicationsForJob,
  canManageCompanyProfile,
  canManageEmployerAccounts,
  canManageJob,
  canManageSubscription,
  canReadCompanyProfile,
  canReadSubscription,
  canViewCompanyAnalytics,
  canViewRecruiterAnalytics,
  isActiveMembership,
  isEmployerCompanyRole,
  isOwnerOrAdmin,
} from "./employerPermissions";
export type {
  EmployerAccountStatus,
  EmployerCompanyRole,
  EmployerMembership,
} from "./employerPermissions";
