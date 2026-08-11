"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { resolveEmployerMembership } from "@/features/employer-auth/services/employerMembershipService";
import {
  canManageEmployerAccounts,
  type EmployerCompanyRole,
} from "@/lib/auth/employerPermissions";
import { teamService } from "../services/teamService";
import type {
  InvitationRole,
  TeamInvitation,
  TeamMember,
  TeamRoleFilter,
  TeamStatusFilter,
} from "../types/team.types";
import { memberDisplayName } from "../types/team.types";

type LoadState = "idle" | "loading" | "success" | "error";

export function useTeamUsers() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [companyRole, setCompanyRole] = useState<EmployerCompanyRole | null>(null);
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<TeamRoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<TeamStatusFilter>("all");
  const [searchDraft, setSearchDraft] = useState("");

  const canManage = canManageEmployerAccounts(companyRole);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);

    const membership = await resolveEmployerMembership();
    if (membership.status !== "active") {
      setCompanyRole(null);
      setCurrentAccountId(null);
      setMembers([]);
      setInvitations([]);
      setError("Unable to verify your company membership.");
      setStatus("error");
      return;
    }

    setCompanyRole(membership.membership.role);
    setCurrentAccountId(membership.membership.accountId);

    if (!canManageEmployerAccounts(membership.membership.role)) {
      setMembers([]);
      setInvitations([]);
      setStatus("success");
      return;
    }

    const [membersResult, invitesResult] = await Promise.all([
      teamService.listMembers(),
      teamService.listPendingInvitations(),
    ]);

    if (!membersResult.success) {
      setMembers([]);
      setInvitations([]);
      setError(membersResult.error);
      setStatus("error");
      return;
    }

    setMembers(membersResult.data);
    if (invitesResult.success) {
      setInvitations(invitesResult.data);
    } else {
      setInvitations([]);
    }
    setStatus("success");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearch(searchDraft.trim().toLowerCase());
    }, 250);
    return () => window.clearTimeout(handle);
  }, [searchDraft]);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (roleFilter !== "all" && member.role !== roleFilter) return false;
      if (statusFilter !== "all" && member.status !== statusFilter) return false;
      if (!search) return true;
      const haystack = `${memberDisplayName(member)} ${member.email}`.toLowerCase();
      return haystack.includes(search);
    });
  }, [members, roleFilter, search, statusFilter]);

  const inviteMember = useCallback(
    async (email: string, role: InvitationRole) => {
      const result = await teamService.createInvitation({ email, role });
      if (!result.success) {
        toast.error(result.error);
        return false;
      }
      toast.success(
        "Invitation created successfully. Email delivery will be connected in a later step.",
      );
      await load();
      return true;
    },
    [load],
  );

  const resendInvitation = useCallback(
    async (invitationId: string) => {
      const result = await teamService.resendInvitation(invitationId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.message(
        "Invitation refreshed. Email delivery is not configured yet.",
      );
      await load();
    },
    [load],
  );

  const cancelInvitation = useCallback(
    async (invitationId: string) => {
      const result = await teamService.cancelInvitation(invitationId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Invitation cancelled.");
      await load();
    },
    [load],
  );

  const changeRole = useCallback(
    async (memberId: string, nextRole: Exclude<EmployerCompanyRole, "owner">) => {
      const result = await teamService.changeRole({
        memberId,
        nextRole,
        members,
      });
      if (!result.success) {
        toast.error(result.error);
        return false;
      }
      toast.success("Role updated.");
      await load();
      return true;
    },
    [load, members],
  );

  const suspendMember = useCallback(
    async (memberId: string) => {
      const result = await teamService.setStatus({
        memberId,
        status: "suspended",
        members,
      });
      if (!result.success) {
        toast.error(result.error);
        return false;
      }
      toast.success("Member suspended.");
      await load();
      return true;
    },
    [load, members],
  );

  const activateMember = useCallback(
    async (memberId: string) => {
      const result = await teamService.setStatus({
        memberId,
        status: "active",
        members,
      });
      if (!result.success) {
        toast.error(result.error);
        return false;
      }
      toast.success("Member reactivated.");
      await load();
      return true;
    },
    [load, members],
  );

  const removeMember = useCallback(
    async (memberId: string) => {
      const result = await teamService.removeMember({ memberId, members });
      if (!result.success) {
        toast.error(result.error);
        return false;
      }
      toast.success("Member removed from your company.");
      await load();
      return true;
    },
    [load, members],
  );

  return {
    members,
    filteredMembers,
    invitations,
    isLoading: status === "loading" || status === "idle",
    isError: status === "error",
    error,
    canManage,
    companyRole,
    currentAccountId,
    searchDraft,
    setSearchDraft,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    reload: () => void load(),
    inviteMember,
    resendInvitation,
    cancelInvitation,
    changeRole,
    suspendMember,
    activateMember,
    removeMember,
  };
}
