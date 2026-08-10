"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { interviewService } from "@/features/employer-interviews";
import type { EmployerInterview } from "@/features/employer-interviews";
import { ConversationList } from "../components/ConversationList";
import {
  ConversationSkeleton,
  MessageSkeleton,
} from "../components/MessageSkeletons";
import { MessageThread } from "../components/MessageThread";
import { useConversations, useUnreadMessageCount } from "../hooks/useMessages";
import { messageService } from "../services/messageService";
import type { EmployerConversation } from "../types/message.types";

export function MessagesPage() {
  const searchParams = useSearchParams();
  const conversationParam = searchParams.get("conversation");
  const candidateParam = searchParams.get("candidate");

  const [search, setSearch] = useState("");
  const { conversations, isLoading, isError, error, reload } =
    useConversations(search);
  const { reload: reloadUnread } = useUnreadMessageCount();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] =
    useState<EmployerConversation | null>(null);
  const [interview, setInterview] = useState<EmployerInterview | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [mobileShowThread, setMobileShowThread] = useState(false);

  useEffect(() => {
    if (conversationParam) {
      setActiveId(conversationParam);
      setMobileShowThread(true);
      return;
    }
    if (!candidateParam || conversations.length === 0) return;
    const match = conversations.find(
      (conversation) => conversation.candidateId === candidateParam,
    );
    if (match) {
      setActiveId(match.id);
      setMobileShowThread(true);
    }
  }, [candidateParam, conversationParam, conversations]);

  useEffect(() => {
    if (!activeId) {
      setActiveConversation(null);
      setInterview(null);
      return;
    }

    let cancelled = false;

    const loadThread = async () => {
      setThreadLoading(true);
      const conversationResult =
        await messageService.markConversationRead(activeId);

      if (cancelled) return;

      if (!conversationResult.success) {
        toast.error(conversationResult.error);
        setThreadLoading(false);
        return;
      }

      setActiveConversation(conversationResult.data);
      void reloadUnread();

      const interviewResult = await interviewService.getByApplication(
        conversationResult.data.applicationId,
      );
      if (!cancelled && interviewResult.success) {
        setInterview(
          interviewResult.data?.status === "scheduled"
            ? interviewResult.data
            : null,
        );
      }
      if (!cancelled) setThreadLoading(false);
    };

    void loadThread();

    const unsubscribe = messageService.subscribeToConversation(activeId, () => {
      void (async () => {
        const result = await messageService.getConversation(activeId);
        if (result.success) {
          setActiveConversation(result.data);
          void reload();
          void reloadUnread();
        }
      })();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [activeId, reload, reloadUnread]);

  const handleSend = async (content: string) => {
    if (!activeId || sending) return;
    setSending(true);
    const result = await messageService.sendMessage(activeId, content);
    setSending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setActiveConversation(result.data);
    void reload();
    toast.success("Message sent.");
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-7xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Messages
        </h1>
        <p className="mt-1 text-sm text-muted">
          Communicate with candidates about applications and interviews.
        </p>
      </div>

      {isError ? (
        <ErrorState
          title="Unable to load conversations."
          description={error ?? undefined}
          onRetry={() => void reload()}
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-hidden rounded-[var(--radius-card)] border border-border bg-card shadow-soft">
          <div className="grid h-full min-h-0 lg:grid-cols-[22rem_minmax(0,1fr)]">
            <div
              className={`min-h-0 border-r border-border ${
                mobileShowThread ? "hidden lg:block" : "block"
              }`}
            >
              {isLoading ? (
                <div className="p-4">
                  <ConversationSkeleton />
                </div>
              ) : (
                <ConversationList
                  conversations={conversations}
                  activeId={activeId}
                  search={search}
                  onSearchChange={setSearch}
                  onSelect={(conversationId) => {
                    setActiveId(conversationId);
                    setMobileShowThread(true);
                  }}
                />
              )}
            </div>

            <div
              className={`min-h-0 ${
                mobileShowThread ? "block" : "hidden lg:block"
              }`}
            >
              {threadLoading ? <MessageSkeleton /> : null}

              {!threadLoading && activeConversation ? (
                <MessageThread
                  conversation={activeConversation}
                  interview={interview}
                  sending={sending}
                  onBack={() => setMobileShowThread(false)}
                  onSend={handleSend}
                />
              ) : null}

              {!threadLoading && !activeConversation ? (
                <div className="flex h-full items-center justify-center p-6">
                  <EmptyState
                    icon={MessageSquare}
                    title="Select a conversation"
                    description="Choose a candidate on the left to view and send messages."
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
