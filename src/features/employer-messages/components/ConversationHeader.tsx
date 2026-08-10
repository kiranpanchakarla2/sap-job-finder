"use client";

import { ArrowLeft } from "lucide-react";
import { ApplicationStatusBadge } from "@/features/employer-applicants/components/ApplicationStatusBadge";
import { ApplicantAvatar } from "@/features/employer-applicants/components/ApplicantAvatar";
import type { EmployerConversation } from "../types/message.types";

export function ConversationHeader({
  conversation,
  onBack,
}: {
  conversation: EmployerConversation;
  onBack?: () => void;
}) {
  return (
    <header className="flex items-start gap-3 border-b border-border p-4">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted transition hover:text-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 lg:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </button>
      ) : null}
      <ApplicantAvatar
        name={conversation.candidateName}
        avatarUrl={conversation.candidateAvatarUrl}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-text">
            {conversation.candidateName}
          </h2>
          <ApplicationStatusBadge status={conversation.applicationStatus} />
        </div>
        <p className="mt-0.5 text-sm text-muted">{conversation.jobTitle}</p>
        <p className="mt-1 text-xs text-muted">
          Application:{" "}
          {conversation.applicationStatus.charAt(0).toUpperCase() +
            conversation.applicationStatus.slice(1)}
        </p>
      </div>
    </header>
  );
}
