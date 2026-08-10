"use client";

import { ApplicantAvatar } from "@/features/employer-applicants/components/ApplicantAvatar";
import { formatMessageTime, getLastMessagePreview } from "../lib/format";
import type { EmployerConversation } from "../types/message.types";

export function ConversationItem({
  conversation,
  active,
  onSelect,
}: {
  conversation: EmployerConversation;
  active: boolean;
  onSelect: () => void;
}) {
  const lastMessage =
    conversation.messages[conversation.messages.length - 1]?.content ??
    "No messages yet.";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full gap-3 rounded-[var(--radius-control)] border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
        active
          ? "border-primary/30 bg-primary/10"
          : "border-transparent hover:border-border hover:bg-surface"
      }`}
      aria-current={active ? "true" : undefined}
    >
      <ApplicantAvatar
        name={conversation.candidateName}
        avatarUrl={conversation.candidateAvatarUrl}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-text">
            {conversation.candidateName}
          </p>
          <time
            className="shrink-0 text-[11px] text-muted"
            dateTime={conversation.lastMessageAt}
          >
            {formatMessageTime(conversation.lastMessageAt)}
          </time>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">
          {conversation.jobTitle}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <p className="truncate text-xs text-muted">
            {getLastMessagePreview(lastMessage)}
          </p>
          {conversation.unreadCount > 0 ? (
            <span
              className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white"
              aria-label={`${conversation.unreadCount} unread messages`}
            >
              {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
