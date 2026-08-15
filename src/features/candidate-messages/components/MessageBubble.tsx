import { Check, CheckCheck } from "lucide-react";
import { formatMessageTime } from "../lib/format";
import type { CandidateMessage } from "../types/message.types";

export function MessageBubble({
  message,
  showSenderName = false,
}: {
  message: CandidateMessage;
  showSenderName?: boolean;
}) {
  const isCandidate = message.sender === "candidate";

  return (
    <div
      className={`flex w-full min-w-0 flex-col ${
        isCandidate ? "items-end" : "items-start"
      }`}
    >
      {showSenderName && !isCandidate ? (
        <span className="mb-1 ml-1 truncate max-w-full text-[11px] font-semibold text-muted">
          {message.senderName || "Employer"}
        </span>
      ) : null}

      <div
        className={`relative max-w-[88%] sm:max-w-[75%] min-w-0 rounded-2xl px-3.5 py-2.5 sm:px-4 text-xs sm:text-sm shadow-soft overflow-hidden ${
          isCandidate
            ? "bg-primary text-white"
            : "border border-border bg-card text-text"
        }`}
      >
        <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed">
          {message.content}
        </p>

        <div
          className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] sm:text-[11px] ${
            isCandidate ? "text-white/80" : "text-muted"
          }`}
        >
          <time dateTime={message.timestamp}>
            {formatMessageTime(message.timestamp)}
          </time>

          {isCandidate ? (
            <span
              className="inline-flex items-center"
              title={`Status: ${message.status || "sent"}`}
              aria-label={`Status: ${message.status || "sent"}`}
            >
              {message.status === "read" ? (
                <CheckCheck size={13} className="text-white" aria-hidden="true" />
              ) : message.status === "delivered" ? (
                <CheckCheck size={13} className="text-white/70" aria-hidden="true" />
              ) : (
                <Check size={13} className="text-white/70" aria-hidden="true" />
              )}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
