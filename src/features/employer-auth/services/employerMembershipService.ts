import { createClient } from "@/lib/supabase/client";
import type { EmployerCompanyRole, EmployerAccountStatus } from "@/lib/auth/employerPermissions";
import { isEmployerCompanyRole } from "@/lib/auth/employerPermissions";

export type EmployerMembershipRecord = {
  accountId: string;
  companyId: string;
  role: EmployerCompanyRole;
  status: EmployerAccountStatus;
};

export type EmployerMembershipResult =
  | { status: "active"; membership: EmployerMembershipRecord }
  | { status: "suspended"; membership: EmployerMembershipRecord }
  | { status: "missing" }
  | { status: "error"; error: string };

/**
 * Resolve auth.uid → employer_accounts → company + role.
 * Platform admin without membership is treated as missing for portal tenancy.
 */
export async function resolveEmployerMembership(): Promise<EmployerMembershipResult> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { status: "missing" };
  }

  const { data, error } = await supabase
    .from("employer_accounts")
    .select("id, company_id, role, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(5);

  if (error) {
    return { status: "error", error: error.message };
  }

  const rows = data ?? [];
  const suspended = rows.find((row) => row.status === "suspended");
  const active = rows.find((row) => row.status === "active");

  if (active && isEmployerCompanyRole(active.role)) {
    return {
      status: "active",
      membership: {
        accountId: active.id,
        companyId: active.company_id,
        role: active.role,
        status: "active",
      },
    };
  }

  if (suspended && isEmployerCompanyRole(suspended.role)) {
    return {
      status: "suspended",
      membership: {
        accountId: suspended.id,
        companyId: suspended.company_id,
        role: suspended.role,
        status: "suspended",
      },
    };
  }

  return { status: "missing" };
}
