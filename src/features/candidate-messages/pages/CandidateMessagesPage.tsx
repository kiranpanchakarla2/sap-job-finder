"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { ConversationHeader } from "../components/ConversationHeader";
import { ConversationList } from "../components/ConversationList";
import { MessageComposer } from "../components/MessageComposer";
import { MessageList } from "../components/MessageList";
import {
  ConversationListSkeleton,
  MessageThreadSkeleton,
} from "../components/MessageSkeletons";
import { NewMessageModal } from "../components/NewMessageModal";
import { useCandidateMessages } from "../context/CandidateMessagesProvider";

export function CandidateMessagesPage() {
  const searchParams = useSearchParams();
  const conversationParam = searchParams.get("conversation");
  const jobParam = searchParams.get("job");
  const applicationParam = searchParams.get("application");

  const {
    conversations,
    allConversations,
    activeId,
    activeConversation,
    search,
    isLoading,
    isError,
    error,
    setSearch,
    selectConversation,
    sendMessage,
    startNewConversation,
    reload,
  } = useCandidateMessages();

  const [sending, setSending] = useState(false);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [newModalOpen, setNewModalOpen] = useState(false);

  // Auto-select from query params if specified
  useEffect(() => {
    if (allConversations.length === 0) return;

    if (conversationParam) {
      void selectConversation(conversationParam);
      setMobileShowThread(true);
      return;
    }

    if (applicationParam) {
      const match = allConversations.find(
        (c) => c.applicationId === applicationParam,
      );
      if (match) {
        void selectConversation(match.id);
        setMobileShowThread(true);
        return;
      }
    }

    if (jobParam) {
      const match = allConversations.find((c) => c.jobId === jobParam);
      if (match) {
        void selectConversation(match.id);
        setMobileShowThread(true);
      }
    }
  }, [conversationParam, applicationParam, jobParam, allConversations, selectConversation]);

  const handleSelect = (conversationId: string) => {
    void selectConversation(conversationId);
    setMobileShowThread(true);
  };

  const handleBack = () => {
    setMobileShowThread(false);
  };

  const handleSend = async (content: string) => {
    if (!activeId || sending) return;
    setSending(true);
    try {
      await sendMessage(content);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-7.5rem)] sm:h-[calc(100vh-8.5rem)] w-full max-w-7xl min-w-0 flex-col gap-3 sm:gap-4">
      {/* Page Heading */}
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-text">
          Messages
        </h1>
        <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted">
          Communicate with employers about your applications and opportunities.
        </p>
      </div>

      {isError ? (
        <ErrorState
          title="Unable to load messages"
          description={error ?? "An error occurred while loading your conversations."}
          onRetry={() => void reload()}
        />
      ) : (
        <div className="min-h-0 flex-1 w-full min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-border bg-card shadow-soft">
          <div className="grid h-full min-h-0 w-full min-w-0 grid-cols-1 lg:grid-cols-[22rem_minmax(0,1fr)]">
            {/* Left Column: Conversation List */}
            <div
              className={`h-full min-h-0 w-full min-w-0 lg:border-r lg:border-border ${
                mobileShowThread ? "hidden lg:block" : "block"
              }`}
            >
              {isLoading ? (
                <ConversationListSkeleton />
              ) : (
                <ConversationList
                  conversations={conversations}
                  allCount={allConversations.length}
                  activeId={activeId}
                  search={search}
                  onSearchChange={setSearch}
                  onSelect={handleSelect}
                  onNewMessage={() => setNewModalOpen(true)}
                />
              )}
            </div>

            {/* Right Column: Conversation Detail / Message Thread */}
            <div
              className={`h-full min-h-0 w-full min-w-0 ${
                mobileShowThread ? "block" : "hidden lg:block"
              }`}
            >
              {isLoading ? (
                <MessageThreadSkeleton />
              ) : activeConversation ? (
                <div className="flex h-full min-h-0 w-full min-w-0 flex-col bg-surface/30">
                  <ConversationHeader
                    conversation={activeConversation}
                    onBack={handleBack}
                  />

                  <MessageList messages={activeConversation.messages} />

                  <MessageComposer sending={sending} onSend={handleSend} />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center p-8">
                  <EmptyState
                    icon={MessageSquare}
                    title="Select a conversation"
                    description="Choose a conversation to view your messages."
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Message Dialog */}
      <NewMessageModal
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        onSubmit={async (input) => {
          const created = await startNewConversation(input);
          if (created) {
            setMobileShowThread(true);
          }
        }}
      />
    </div>
  );
}
