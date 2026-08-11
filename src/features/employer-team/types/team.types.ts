import type {
  EmployerAccountStatus,
  EmployerCompanyRole,
} from "@/lib/auth/employerPermissions";

export type TeamMember = {
  id: string;
  userId: string;
  companyId: string;
  role: EmployerCompanyRole;
  status: EmployerAccountStatus;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InvitationRole = Exclude<EmployerCompanyRole, "owner">;

export type TeamInvitation = {
  id: string;
  companyId: string;
  email: string;
  role: InvitationRole;
  invitedBy: string | null;
  status: "pending" | "accepted" | "cancelled" | "expired";
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export type TeamRoleFilter = "all" | EmployerCompanyRole;
export type TeamStatusFilter = "all" | EmployerAccountStatus;

export type TeamServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export const INVITE_ROLE_OPTIONS: { value: InvitationRole; label: string }[] = [
  { value: "recruiter", label: "Recruiter" },
  { value: "hiring_manager", label: "Hiring Manager" },
];

export const CHANGE_ROLE_OPTIONS: {
  value: Exclude<EmployerCompanyRole, "owner">;
  label: string;
}[] = [
  { value: "admin", label: "Admin" },
  { value: "recruiter", label: "Recruiter" },
  { value: "hiring_manager", label: "Hiring Manager" },
];

export function teamRoleLabel(role: EmployerCompanyRole): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "recruiter":
      return "Recruiter";
    case "hiring_manager":
      return "Hiring Manager";
    default:
      return role;
  }
}

export function teamStatusLabel(status: EmployerAccountStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "invited":
      return "Invited";
    case "suspended":
      return "Suspended";
    default:
      return status;
  }
}

export function memberDisplayName(member: TeamMember): string {
  const name = [member.firstName, member.lastName].filter(Boolean).join(" ").trim();
  return name || member.email || "Team member";
}

export function memberInitials(member: TeamMember): string {
  const name = memberDisplayName(member);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}
