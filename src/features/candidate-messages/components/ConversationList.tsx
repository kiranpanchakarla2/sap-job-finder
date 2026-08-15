"use client";

import Link from "next/link";
import { MessageSquare, Plus, Search, X } from "lucide-react";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import type { CandidateConversation } from "../types/message.types";
import { ConversationItem } from "./ConversationItem";

export function ConversationList({
  conversations,
  allCount,
  activeId,
  search,
  onSearchChange,
  onSelect,
  onNewMessage,
}: {
  conversations: CandidateConversation[];
  allCount: number;
  activeId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (conversationId: string) => void;
  onNewMessage?: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col bg-card/50">
      {/* Search Header */}
      <div className="border-b border-border p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <label htmlFor="candidate-message-search" className="sr-only">
              Search conversations
            </label>
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              id="candidate-message-search"
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search company, job, or message…"
              className="w-full min-w-0 rounded-[var(--radius-control)] border border-border bg-input py-2 pl-9 pr-8 text-xs sm:text-sm text-input-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            />
            {search ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                aria-label="Clear search query"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          {onNewMessage ? (
            <button
              type="button"
              onClick={onNewMessage}
              title="New Message"
              aria-label="Start new conversation"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-soft transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              <Plus size={18} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Conversations Stream */}
      <div className="min-h-0 flex-1 w-full min-w-0 overflow-y-auto p-2 sm:p-3">
        {allCount === 0 ? (
          <div className="p-3">
            <EmptyState
              icon={MessageSquare}
              title="No messages yet"
              description="Your conversations with employers will appear here."
              action={
                <Link
                  href="/candidate/jobs"
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                >
                  Find Jobs
                </Link>
              }
            />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-3">
            <EmptyState
              icon={Search}
              title="No conversations found"
              description="Try a different company or job title."
              action={
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-text shadow-soft hover:bg-surface/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                >
                  Clear search
                </button>
              }
            />
          </div>
        ) : (
          <ul className="space-y-1 w-full min-w-0" role="list">
            {conversations.map((conversation) => (
              <li key={conversation.id} className="w-full min-w-0">
                <ConversationItem
                  conversation={conversation}
                  active={activeId === conversation.id}
                  onSelect={() => onSelect(conversation.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
