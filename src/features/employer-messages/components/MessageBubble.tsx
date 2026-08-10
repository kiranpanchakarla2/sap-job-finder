import { formatMessageTime } from "../lib/format";
import type { ConversationMessage } from "../types/message.types";

export function MessageBubble({ message }: { message: ConversationMessage }) {
  const isEmployer = message.sender === "employer";

  return (
    <div
      className={`flex ${isEmployer ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-soft sm:max-w-[70%] ${
          isEmployer
            ? "bg-primary text-button-fg"
            : "border border-border bg-card text-text"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <time
          className={`mt-1.5 block text-[11px] ${
            isEmployer ? "text-button-fg/80" : "text-muted"
          }`}
          dateTime={message.timestamp}
        >
          {formatMessageTime(message.timestamp)}
        </time>
      </div>
    </div>
  );
}
