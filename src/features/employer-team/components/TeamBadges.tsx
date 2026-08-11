import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import type {
  EmployerAccountStatus,
  EmployerCompanyRole,
} from "@/lib/auth/employerPermissions";
import { teamRoleLabel, teamStatusLabel } from "../types/team.types";

export function RoleBadge({ role }: { role: EmployerCompanyRole }) {
  const tone =
    role === "owner"
      ? "default"
      : role === "admin"
        ? "info"
        : role === "recruiter"
          ? "success"
          : "muted";
  return <StatusBadge tone={tone}>{teamRoleLabel(role)}</StatusBadge>;
}

export function MemberStatusBadge({ status }: { status: EmployerAccountStatus }) {
  const tone =
    status === "active"
      ? "success"
      : status === "invited"
        ? "warning"
        : "danger";
  return <StatusBadge tone={tone}>{teamStatusLabel(status)}</StatusBadge>;
}
