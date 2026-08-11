"use client";

import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { Button } from "@/components/ui/Button";
import { Mail } from "lucide-react";
import { teamRoleLabel, type TeamInvitation } from "../types/team.types";
import { RoleBadge } from "./TeamBadges";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";

function formatDate(iso: string): string {
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

export function PendingInvitations({
  invitations,
  onResend,
  onCancel,
}: {
  invitations: TeamInvitation[];
  onResend: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  if (invitations.length === 0) {
    return (
      <EmptyState
        icon={Mail}
        title="No pending invitations."
        description="Invite colleagues to collaborate on hiring for your company."
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Invited</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invitations.map((invite) => (
              <tr
                key={invite.id}
                className="border-b border-border/70 last:border-0"
              >
                <td className="px-4 py-3 font-medium text-text">{invite.email}</td>
                <td className="px-4 py-3">
                  <RoleBadge role={invite.role} />
                </td>
                <td className="px-4 py-3 text-muted">
                  {formatDate(invite.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge tone="warning">Pending</StatusBadge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="!px-3 !py-2 text-xs"
                      onClick={() => onResend(invite.id)}
                    >
                      Resend
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="!px-3 !py-2 text-xs text-error"
                      onClick={() => onCancel(invite.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {invitations.map((invite) => (
          <li
            key={invite.id}
            className="rounded-[var(--radius-card)] border border-border bg-surface/40 p-4"
          >
            <p className="font-medium text-text">{invite.email}</p>
            <p className="mt-1 text-sm text-muted">
              {teamRoleLabel(invite.role)} · {formatDate(invite.createdAt)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                className="!px-3 !py-2 text-xs"
                onClick={() => onResend(invite.id)}
              >
                Resend
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="!px-3 !py-2 text-xs text-error"
                onClick={() => onCancel(invite.id)}
              >
                Cancel
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
