"use client";

import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import type { EmployerConversation } from "../types/message.types";
import { ConversationItem } from "./ConversationItem";

export function ConversationList({
  conversations,
  activeId,
  search,
  onSearchChange,
  onSelect,
}: {
  conversations: EmployerConversation[];
  activeId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (conversationId: string) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border p-4">
        <label htmlFor="message-search" className="sr-only">
          Search conversations
        </label>
        <input
          id="message-search"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search candidate, job, or message"
          className="w-full rounded-[var(--radius-control)] border border-border bg-input px-3 py-2.5 text-sm text-input-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <div className="p-3">
            <EmptyState
              icon={MessageSquare}
              title={
                search.trim()
                  ? "No conversations found."
                  : "No conversations yet."
              }
              description={
                search.trim()
                  ? "Try a different search term."
                  : "Messages with candidates will appear here."
              }
            />
          </div>
        ) : (
          <ul className="space-y-1">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
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
