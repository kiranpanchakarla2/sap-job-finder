"use client";

import { useEffect, useRef } from "react";
import type { EmployerInterview } from "@/features/employer-interviews/types/interview.types";
import type { EmployerConversation } from "../types/message.types";
import { ConversationHeader } from "./ConversationHeader";
import { InterviewContextCard } from "./InterviewContextCard";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";

export function MessageThread({
  conversation,
  interview,
  sending,
  onBack,
  onSend,
}: {
  conversation: EmployerConversation;
  interview: EmployerInterview | null;
  sending?: boolean;
  onBack?: () => void;
  onSend: (content: string) => Promise<void>;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation.messages.length, conversation.id]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ConversationHeader conversation={conversation} onBack={onBack} />
      {interview ? <InterviewContextCard interview={interview} /> : null}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {conversation.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={bottomRef} />
      </div>
      <MessageComposer sending={sending} onSend={onSend} />
    </div>
  );
}
