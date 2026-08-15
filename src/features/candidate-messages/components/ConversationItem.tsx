"use client";

import { formatShortDate } from "../lib/format";
import type { CandidateConversation } from "../types/message.types";
import { CompanyAvatar } from "./CompanyAvatar";

export function ConversationItem({
  conversation,
  active,
  onSelect,
}: {
  conversation: CandidateConversation;
  active: boolean;
  onSelect: () => void;
}) {
  const isUnread = conversation.unreadCount > 0;
  const lastMessage =
    conversation.lastMessagePreview ||
    conversation.messages[conversation.messages.length - 1]?.content ||
    "No messages yet.";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex w-full min-w-0 items-start gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border p-2.5 sm:p-3.5 text-left transition-all duration-150 overflow-hidden focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
        active
          ? "border-primary/40 bg-primary/[0.08] shadow-soft"
          : isUnread
            ? "border-border/80 bg-card hover:border-primary/30 hover:bg-surface/90"
            : "border-transparent bg-transparent hover:border-border hover:bg-surface/70"
      }`}
      aria-current={active ? "true" : undefined}
      aria-label={`Conversation with ${conversation.companyName} for ${conversation.jobTitle}${
        isUnread ? `, ${conversation.unreadCount} unread messages` : ""
      }`}
    >
      <CompanyAvatar
        name={conversation.companyName}
        logo={conversation.companyLogo}
        logoColor={conversation.companyLogoColor}
        logoUrl={conversation.companyLogoUrl}
        size="md"
      />

      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <p
            className={`truncate text-xs sm:text-sm ${
              isUnread ? "font-bold text-text" : "font-semibold text-text/90"
            }`}
          >
            {conversation.companyName}
          </p>
          <time
            className="shrink-0 text-[10px] sm:text-[11px] font-medium text-muted"
            dateTime={conversation.lastMessageAt}
          >
            {formatShortDate(conversation.lastMessageAt)}
          </time>
        </div>

        <p className="mt-0.5 truncate text-[11px] sm:text-xs font-medium text-muted">
          {conversation.jobTitle}
        </p>

        <div className="mt-1 flex items-center justify-between gap-2 min-w-0">
          <p
            className={`truncate text-[11px] sm:text-xs ${
              isUnread ? "font-semibold text-text" : "text-muted"
            }`}
          >
            {lastMessage}
          </p>
          {isUnread ? (
            <span
              className="inline-flex h-4 min-w-4 sm:h-5 sm:min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1 text-[9px] sm:text-[10px] font-bold text-white shadow-soft"
              aria-label={`${conversation.unreadCount} unread`}
            >
              {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
