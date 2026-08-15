"use client";

import { useId, useState } from "react";
import { Loader2, Send } from "lucide-react";

export function MessageComposer({
  disabled = false,
  sending = false,
  onSend,
}: {
  disabled?: boolean;
  sending?: boolean;
  onSend: (content: string) => Promise<boolean | void> | void;
}) {
  const inputId = useId();
  const [value, setValue] = useState("");
  const MAX_CHARS = 5000;

  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && trimmed.length <= MAX_CHARS && !disabled && !sending;

  const submit = async () => {
    if (!canSend) return;
    const content = value;
    setValue("");
    await onSend(content);
  };

  return (
    <form
      className="border-t border-border bg-card p-3 sm:p-4 w-full min-w-0"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Type your message
      </label>
      <div className="flex items-end gap-2 sm:gap-2.5 w-full min-w-0">
        <textarea
          id={inputId}
          rows={2}
          value={value}
          disabled={disabled || sending}
          placeholder="Type your message…"
          maxLength={MAX_CHARS}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          className="min-h-[2.5rem] sm:min-h-[2.75rem] max-h-32 min-w-0 flex-1 resize-none rounded-[var(--radius-control)] border border-border bg-input px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm text-input-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={!canSend}
          className="inline-flex h-10 sm:h-11 shrink-0 items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-primary px-3 sm:px-4 text-xs sm:text-sm font-semibold text-white shadow-soft transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          {sending ? (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          ) : (
            <Send size={15} aria-hidden="true" />
          )}
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
        <span>Enter to send · Shift + Enter for new line</span>
        {value.length > 3000 ? (
          <span
            className={`font-medium ${
              value.length >= MAX_CHARS ? "text-error" : "text-muted"
            }`}
          >
            {value.length}/{MAX_CHARS}
          </span>
        ) : null}
      </div>
    </form>
  );
}
