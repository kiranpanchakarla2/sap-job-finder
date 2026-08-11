"use client";

import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { Users } from "lucide-react";
import {
  memberDisplayName,
  memberInitials,
  type TeamMember,
} from "../types/team.types";
import { MemberStatusBadge, RoleBadge } from "./TeamBadges";
import {
  TeamMemberActionsMenu,
  type TeamMemberAction,
} from "./TeamMemberActionsMenu";

function formatJoined(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function Avatar({ member }: { member: TeamMember }) {
  if (member.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={member.avatarUrl}
        alt=""
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }
  return (
    <span
      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
      aria-hidden="true"
    >
      {memberInitials(member)}
    </span>
  );
}

export function TeamMembersTable({
  members,
  currentAccountId,
  emptyTitle,
  emptyDescription,
  onAction,
}: {
  members: TeamMember[];
  currentAccountId: string | null;
  emptyTitle: string;
  emptyDescription: string;
  onAction: (member: TeamMember, action: TeamMemberAction) => void;
}) {
  if (members.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr
                key={member.id}
                className="border-b border-border/70 last:border-0"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar member={member} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text">
                        {memberDisplayName(member)}
                      </p>
                      <p className="truncate text-muted">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <RoleBadge role={member.role} />
                </td>
                <td className="px-4 py-3">
                  <MemberStatusBadge status={member.status} />
                </td>
                <td className="px-4 py-3 text-muted">
                  {formatJoined(member.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <TeamMemberActionsMenu
                    member={member}
                    isSelf={member.id === currentAccountId}
                    onAction={(action) => onAction(member, action)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {members.map((member) => (
          <li
            key={member.id}
            className="rounded-[var(--radius-card)] border border-border bg-surface/40 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar member={member} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-text">
                    {memberDisplayName(member)}
                  </p>
                  <p className="truncate text-sm text-muted">{member.email}</p>
                </div>
              </div>
              <TeamMemberActionsMenu
                member={member}
                isSelf={member.id === currentAccountId}
                onAction={(action) => onAction(member, action)}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <RoleBadge role={member.role} />
              <MemberStatusBadge status={member.status} />
              <span className="text-xs text-muted">
                Joined {formatJoined(member.createdAt)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
