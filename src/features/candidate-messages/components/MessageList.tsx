"use client";

import { useEffect, useRef } from "react";
import { formatDateSeparator } from "../lib/format";
import type { CandidateMessage } from "../types/message.types";
import { MessageBubble } from "./MessageBubble";

export function MessageList({
  messages,
}: {
  messages: CandidateMessage[];
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return (
    <div className="flex-1 w-full min-w-0 space-y-3 sm:space-y-4 overflow-y-auto p-3 sm:p-6" role="log" aria-live="polite">
      {messages.map((message, index) => {
        const prevMessage = messages[index - 1];
        const showDateSeparator =
          !prevMessage ||
          formatDateSeparator(prevMessage.timestamp) !==
            formatDateSeparator(message.timestamp);

        const isDifferentSender =
          !prevMessage || prevMessage.sender !== message.sender;

        return (
          <div key={message.id} className="space-y-3">
            {showDateSeparator ? (
              <div className="my-3 flex items-center justify-center">
                <span className="rounded-full border border-border/80 bg-surface/90 px-3 py-1 text-[11px] font-semibold text-muted shadow-soft">
                  {formatDateSeparator(message.timestamp)}
                </span>
              </div>
            ) : null}

            <MessageBubble
              message={message}
              showSenderName={isDifferentSender}
            />
          </div>
        );
      })}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}
