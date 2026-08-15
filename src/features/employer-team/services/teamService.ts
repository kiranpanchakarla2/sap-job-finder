import { createClient } from "@/lib/supabase/client";
import {
  isEmployerCompanyRole,
  type EmployerAccountStatus,
  type EmployerCompanyRole,
} from "@/lib/auth/employerPermissions";
import { resolveEmployerMembership } from "@/features/employer-auth/services/employerMembershipService";
import { getPlanLimit, subscriptionService } from "@/features/employer-subscription";
import type {
  InvitationRole,
  TeamInvitation,
  TeamMember,
  TeamServiceResult,
} from "../types/team.types";

function logError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[teamService] ${context}`, error);
  }
}

function mapMember(raw: Record<string, unknown>): TeamMember | null {
  const id = typeof raw.id === "string" ? raw.id : null;
  const userId = typeof raw.userId === "string" ? raw.userId : null;
  const companyId = typeof raw.companyId === "string" ? raw.companyId : null;
  const role = raw.role;
  const status = raw.status;
  if (!id || !userId || !companyId) return null;
  if (!isEmployerCompanyRole(role)) return null;
  if (status !== "active" && status !== "invited" && status !== "suspended") {
    return null;
  }
  return {
    id,
    userId,
    companyId,
    role,
    status,
    firstName: typeof raw.firstName === "string" ? raw.firstName : null,
    lastName: typeof raw.lastName === "string" ? raw.lastName : null,
    email: typeof raw.email === "string" ? raw.email : "",
    avatarUrl: typeof raw.avatarUrl === "string" ? raw.avatarUrl : null,
    canBulkUpload: raw.canBulkUpload === false ? false : true,
    createdAt:
      typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    updatedAt:
      typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
  };
}

function mapInvitation(row: {
  id: string;
  company_id: string;
  email: string;
  role: string;
  invited_by: string | null;
  status: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}): TeamInvitation | null {
  if (
    row.role !== "admin" &&
    row.role !== "recruiter" &&
    row.role !== "hiring_manager"
  ) {
    return null;
  }
  if (
    row.status !== "pending" &&
    row.status !== "accepted" &&
    row.status !== "cancelled" &&
    row.status !== "expired"
  ) {
    return null;
  }
  return {
    id: row.id,
    companyId: row.company_id,
    email: row.email,
    role: row.role,
    invitedBy: row.invited_by,
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function countActiveOwners(members: TeamMember[]): number {
  return members.filter((m) => m.role === "owner" && m.status === "active").length;
}

export const TEAM_MEMBER_LIMIT_REACHED = "TEAM_MEMBER_LIMIT_REACHED";

export const teamService = {
  async listMembers(): Promise<TeamServiceResult<TeamMember[]>> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("list_company_team_members");
      if (error) {
        logError("listMembers", error);
        return { success: false, error: "Unable to load team members. Please try again." };
      }
      const payload = data as { items?: unknown } | null;
      const items = Array.isArray(payload?.items) ? payload.items : [];
      const members = items
        .map((item) =>
          item && typeof item === "object"
            ? mapMember(item as Record<string, unknown>)
            : null,
        )
        .filter((m): m is TeamMember => Boolean(m));
      return { success: true, data: members };
    } catch (error) {
      logError("listMembers", error);
      return { success: false, error: "Unable to load team members. Please try again." };
    }
  },

  async listPendingInvitations(): Promise<TeamServiceResult<TeamInvitation[]>> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("employer_invitations")
        .select(
          "id, company_id, email, role, invited_by, status, expires_at, created_at, updated_at",
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        logError("listPendingInvitations", error);
        return {
          success: false,
          error: "Unable to load invitations. Please try again.",
        };
      }

      const invitations = (data ?? [])
        .map(mapInvitation)
        .filter((row): row is TeamInvitation => Boolean(row));
      return { success: true, data: invitations };
    } catch (error) {
      logError("listPendingInvitations", error);
      return {
        success: false,
        error: "Unable to load invitations. Please try again.",
      };
    }
  },

  async createInvitation(input: {
    email: string;
    role: InvitationRole;
  }): Promise<TeamServiceResult<TeamInvitation>> {
    try {
      const membership = await resolveEmployerMembership();
      if (membership.status !== "active") {
        return { success: false, error: "You do not have permission to invite members." };
      }

      const email = input.email.trim().toLowerCase();
      if (!email || !email.includes("@")) {
        return { success: false, error: "Enter a valid email address." };
      }

      const subscriptionResult = await subscriptionService.getSubscription();
      const planId = subscriptionResult.success
        ? subscriptionResult.data.planId
        : "free";
      const teamLimit = getPlanLimit(planId, "teamMembers");
      if (teamLimit !== null) {
        const [membersResult, invitesResult] = await Promise.all([
          teamService.listMembers(),
          teamService.listPendingInvitations(),
        ]);
        if (membersResult.success && invitesResult.success) {
          const seatsUsed =
            membersResult.data.filter((member) => member.status === "active").length +
            invitesResult.data.length;
          if (seatsUsed >= teamLimit) {
            return { success: false, error: TEAM_MEMBER_LIMIT_REACHED };
          }
        }
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from("employer_invitations")
        .insert({
          company_id: membership.membership.companyId,
          email,
          role: input.role,
          invited_by: membership.membership.accountId,
          status: "pending",
        })
        .select(
          "id, company_id, email, role, invited_by, status, expires_at, created_at, updated_at",
        )
        .single();

      if (error) {
        logError("createInvitation", error);
        if (error.code === "23505") {
          return {
            success: false,
            error: "A pending invitation already exists for this email.",
          };
        }
        return { success: false, error: "Unable to create invitation. Please try again." };
      }

      const mapped = mapInvitation(data);
      if (!mapped) {
        return { success: false, error: "Unable to create invitation. Please try again." };
      }
      return { success: true, data: mapped };
    } catch (error) {
      logError("createInvitation", error);
      return { success: false, error: "Unable to create invitation. Please try again." };
    }
  },

  async resendInvitation(
    invitationId: string,
  ): Promise<TeamServiceResult<{ emailDeliveryPending: true }>> {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("employer_invitations")
        .update({
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", invitationId)
        .eq("status", "pending");

      if (error) {
        logError("resendInvitation", error);
        return { success: false, error: "Unable to refresh invitation. Please try again." };
      }

      // Email delivery requires a server-side function — not available yet.
      return { success: true, data: { emailDeliveryPending: true } };
    } catch (error) {
      logError("resendInvitation", error);
      return { success: false, error: "Unable to refresh invitation. Please try again." };
    }
  },

  async cancelInvitation(invitationId: string): Promise<TeamServiceResult<null>> {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("employer_invitations")
        .update({ status: "cancelled" })
        .eq("id", invitationId)
        .eq("status", "pending");

      if (error) {
        logError("cancelInvitation", error);
        return { success: false, error: "Unable to cancel invitation. Please try again." };
      }
      return { success: true, data: null };
    } catch (error) {
      logError("cancelInvitation", error);
      return { success: false, error: "Unable to cancel invitation. Please try again." };
    }
  },

  async changeRole(input: {
    memberId: string;
    nextRole: Exclude<EmployerCompanyRole, "owner">;
    members: TeamMember[];
  }): Promise<TeamServiceResult<null>> {
    const target = input.members.find((m) => m.id === input.memberId);
    if (!target) {
      return { success: false, error: "Team member not found." };
    }
    if (target.role === "owner") {
      if (countActiveOwners(input.members) <= 1) {
        return {
          success: false,
          error: "You cannot change the role of the only Owner.",
        };
      }
      return {
        success: false,
        error: "Ownership transfer is not available yet.",
      };
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("employer_accounts")
        .update({ role: input.nextRole })
        .eq("id", input.memberId);

      if (error) {
        logError("changeRole", error);
        return { success: false, error: "Unable to change role. Please try again." };
      }
      return { success: true, data: null };
    } catch (error) {
      logError("changeRole", error);
      return { success: false, error: "Unable to change role. Please try again." };
    }
  },

  async setStatus(input: {
    memberId: string;
    status: Extract<EmployerAccountStatus, "active" | "suspended">;
    members: TeamMember[];
  }): Promise<TeamServiceResult<null>> {
    const target = input.members.find((m) => m.id === input.memberId);
    if (!target) {
      return { success: false, error: "Team member not found." };
    }
    if (target.role === "owner") {
      return { success: false, error: "The Owner account cannot be suspended." };
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("employer_accounts")
        .update({ status: input.status })
        .eq("id", input.memberId);

      if (error) {
        logError("setStatus", error);
        return { success: false, error: "Unable to update member status. Please try again." };
      }
      return { success: true, data: null };
    } catch (error) {
      logError("setStatus", error);
      return { success: false, error: "Unable to update member status. Please try again." };
    }
  },

  async removeMember(input: {
    memberId: string;
    members: TeamMember[];
  }): Promise<TeamServiceResult<null>> {
    const target = input.members.find((m) => m.id === input.memberId);
    if (!target) {
      return { success: false, error: "Team member not found." };
    }
    if (target.role === "owner") {
      return { success: false, error: "The Owner cannot be removed." };
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("employer_accounts")
        .delete()
        .eq("id", input.memberId);

      if (error) {
        logError("removeMember", error);
        return { success: false, error: "Unable to remove member. Please try again." };
      }
      return { success: true, data: null };
    } catch (error) {
      logError("removeMember", error);
      return { success: false, error: "Unable to remove member. Please try again." };
    }
  },

  async updateBulkUploadPermission(input: {
    memberId: string;
    canBulkUpload: boolean;
  }): Promise<TeamServiceResult<null>> {
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc(
        "update_team_member_bulk_upload_permission",
        {
          p_account_id: input.memberId,
          p_can_bulk_upload: input.canBulkUpload,
        }
      );

      if (error) {
        logError("updateBulkUploadPermission", error);
        return {
          success: false,
          error: "Unable to update bulk upload permission. Please verify you are a Company Admin.",
        };
      }
      return { success: true, data: null };
    } catch (error) {
      logError("updateBulkUploadPermission", error);
      return {
        success: false,
        error: "An unexpected error occurred while updating permissions.",
      };
    }
  },
};
