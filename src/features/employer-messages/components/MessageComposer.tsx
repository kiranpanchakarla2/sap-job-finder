"use client";

import { useId, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function MessageComposer({
  disabled = false,
  sending = false,
  onSend,
}: {
  disabled?: boolean;
  sending?: boolean;
  onSend: (content: string) => Promise<void> | void;
}) {
  const inputId = useId();
  const [value, setValue] = useState("");

  const canSend = value.trim().length > 0 && !disabled && !sending;

  const submit = async () => {
    if (!canSend) return;
    const content = value;
    setValue("");
    await onSend(content);
  };

  return (
    <form
      className="border-t border-border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Type a message
      </label>
      <div className="flex items-end gap-2">
        <textarea
          id={inputId}
          rows={2}
          value={value}
          disabled={disabled || sending}
          placeholder="Type a message..."
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          className="min-h-[2.75rem] flex-1 resize-none rounded-[var(--radius-control)] border border-border bg-input px-3 py-2.5 text-sm text-input-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        />
        <Button
          type="submit"
          disabled={!canSend}
          className="!px-4 !py-2.5"
          aria-label="Send message"
        >
          <Send size={16} aria-hidden="true" />
          Send
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-muted">
        Enter to send · Shift + Enter for a new line
      </p>
    </form>
  );
}
