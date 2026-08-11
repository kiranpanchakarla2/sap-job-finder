"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { Skeleton, SkeletonCard } from "@/components/dashboard/shared/Skeleton";
import { JobConfirmationDialog } from "@/features/employer-jobs/components/JobConfirmationDialog";
import { EMPLOYER_ROUTES } from "@/features/employer-company/constants";
import { ChangeRoleDialog } from "../components/ChangeRoleDialog";
import { InviteMemberDialog } from "../components/InviteMemberDialog";
import { PendingInvitations } from "../components/PendingInvitations";
import { TeamMembersTable } from "../components/TeamMembersTable";
import { useTeamUsers } from "../hooks/useTeamUsers";
import {
  memberDisplayName,
  teamRoleLabel,
  type TeamMember,
  type TeamRoleFilter,
  type TeamStatusFilter,
} from "../types/team.types";
import type { TeamMemberAction } from "../components/TeamMemberActionsMenu";

type ConfirmState =
  | { type: "none" }
  | { type: "suspend"; member: TeamMember }
  | { type: "remove"; member: TeamMember }
  | { type: "cancelInvite"; invitationId: string; email: string }
  | { type: "view"; member: TeamMember };

function TeamSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonCard className="h-24" />
      <SkeletonCard className="h-64" />
      <SkeletonCard className="h-48" />
    </div>
  );
}

export function TeamUsersPage() {
  const router = useRouter();
  const team = useTeamUsers();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [changeRoleMember, setChangeRoleMember] = useState<TeamMember | null>(
    null,
  );
  const [confirm, setConfirm] = useState<ConfirmState>({ type: "none" });
  const [busy, setBusy] = useState(false);

  const emptyCopy = useMemo(() => {
    if (team.searchDraft.trim() || team.roleFilter !== "all" || team.statusFilter !== "all") {
      return {
        title: "No members match your search.",
        description: "Try adjusting search or filters.",
      };
    }
    return {
      title: "No team members found.",
      description: "Invite colleagues to collaborate on hiring.",
    };
  }, [team.roleFilter, team.searchDraft, team.statusFilter]);

  if (team.isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <TeamSkeleton />
      </div>
    );
  }

  if (!team.canManage) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <EmptyState
          icon={Shield}
          title="You don’t have access to Team & Users"
          description="Only Owners and Admins can manage employer accounts for this company."
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.replace(EMPLOYER_ROUTES.dashboard)}
            >
              Back to Dashboard
            </Button>
          }
        />
      </div>
    );
  }

  if (team.isError) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <ErrorState
          title="Unable to load team members"
          description={team.error ?? "Please try again."}
          onRetry={team.reload}
        />
      </div>
    );
  }

  const handleAction = (member: TeamMember, action: TeamMemberAction) => {
    switch (action) {
      case "view":
        setConfirm({ type: "view", member });
        break;
      case "changeRole":
        setChangeRoleMember(member);
        break;
      case "suspend":
        setConfirm({ type: "suspend", member });
        break;
      case "activate":
        void team.activateMember(member.id);
        break;
      case "remove":
        setConfirm({ type: "remove", member });
        break;
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">
            Team & Users
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Manage the people who have access to your company on SAP Jobs
            Finder.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="shrink-0"
        >
          <Plus size={16} aria-hidden="true" />
          Invite Member
        </Button>
      </header>

      <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-text">Team Members</h2>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Search members</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={team.searchDraft}
              onChange={(e) => team.setSearchDraft(e.target.value)}
              placeholder="Search members..."
              className="h-11 w-full rounded-xl border border-border bg-input py-2 pl-10 pr-3 text-sm text-input-fg outline-none transition focus:border-primary focus:shadow-[0_0_0_4px_rgba(79,70,229,0.12)]"
            />
          </label>
          <NativeSelect
            aria-label="Filter by role"
            value={team.roleFilter}
            onChange={(e) =>
              team.setRoleFilter(e.target.value as TeamRoleFilter)
            }
            className="h-11 w-full lg:w-44"
          >
            <option value="all">All Roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="recruiter">Recruiter</option>
            <option value="hiring_manager">Hiring Manager</option>
          </NativeSelect>
          <NativeSelect
            aria-label="Filter by status"
            value={team.statusFilter}
            onChange={(e) =>
              team.setStatusFilter(e.target.value as TeamStatusFilter)
            }
            className="h-11 w-full lg:w-44"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="suspended">Suspended</option>
          </NativeSelect>
        </div>

        <div className="mt-5">
          <TeamMembersTable
            members={team.filteredMembers}
            currentAccountId={team.currentAccountId}
            emptyTitle={emptyCopy.title}
            emptyDescription={emptyCopy.description}
            onAction={handleAction}
          />
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-text">Pending Invitations</h2>
        <p className="mt-1 text-sm text-muted">
          Invitations waiting to be accepted.
        </p>
        <div className="mt-5">
          <PendingInvitations
            invitations={team.invitations}
            onResend={(id) => void team.resendInvitation(id)}
            onCancel={(id) => {
              const invite = team.invitations.find((row) => row.id === id);
              setConfirm({
                type: "cancelInvite",
                invitationId: id,
                email: invite?.email ?? "this invitation",
              });
            }}
          />
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-text">Role Information</h2>
        <ul className="mt-4 space-y-3 text-sm text-muted">
          <li>
            <span className="font-semibold text-text">Owner / Admin</span> —
            Manage company profile, team members, all jobs, and applications.
          </li>
          <li>
            <span className="font-semibold text-text">Recruiter</span> — Post and
            manage own jobs and their applications; access Talent Search.
          </li>
          <li>
            <span className="font-semibold text-text">Hiring Manager</span> —
            Work with jobs assigned to them and related applications.
          </li>
        </ul>
      </section>

      <InviteMemberDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={team.inviteMember}
      />

      <ChangeRoleDialog
        open={Boolean(changeRoleMember)}
        member={changeRoleMember}
        onClose={() => setChangeRoleMember(null)}
        onSubmit={team.changeRole}
      />

      <JobConfirmationDialog
        open={confirm.type === "suspend"}
        title="Suspend this team member?"
        description="Suspended members cannot access the Employer Portal."
        confirmLabel="Suspend Access"
        tone="danger"
        loading={busy}
        onCancel={() => setConfirm({ type: "none" })}
        onConfirm={() => {
          if (confirm.type !== "suspend") return;
          void (async () => {
            setBusy(true);
            await team.suspendMember(confirm.member.id);
            setBusy(false);
            setConfirm({ type: "none" });
          })();
        }}
      />

      <JobConfirmationDialog
        open={confirm.type === "remove"}
        title="Remove Team Member?"
        description="This member will lose access to your company. Their login identity is not deleted."
        confirmLabel="Remove Member"
        tone="danger"
        loading={busy}
        onCancel={() => setConfirm({ type: "none" })}
        onConfirm={() => {
          if (confirm.type !== "remove") return;
          void (async () => {
            setBusy(true);
            await team.removeMember(confirm.member.id);
            setBusy(false);
            setConfirm({ type: "none" });
          })();
        }}
      />

      <JobConfirmationDialog
        open={confirm.type === "cancelInvite"}
        title="Cancel invitation?"
        description={
          confirm.type === "cancelInvite"
            ? `Cancel the pending invitation for ${confirm.email}?`
            : ""
        }
        confirmLabel="Cancel Invitation"
        tone="danger"
        loading={busy}
        onCancel={() => setConfirm({ type: "none" })}
        onConfirm={() => {
          if (confirm.type !== "cancelInvite") return;
          void (async () => {
            setBusy(true);
            await team.cancelInvitation(confirm.invitationId);
            setBusy(false);
            setConfirm({ type: "none" });
          })();
        }}
      />

      <JobConfirmationDialog
        open={confirm.type === "view"}
        title="Member profile"
        description={
          confirm.type === "view"
            ? `${memberDisplayName(confirm.member)} · ${confirm.member.email} · ${teamRoleLabel(confirm.member.role)}`
            : ""
        }
        confirmLabel="Close"
        cancelLabel="Close"
        onCancel={() => setConfirm({ type: "none" })}
        onConfirm={() => setConfirm({ type: "none" })}
      />
    </div>
  );
}
