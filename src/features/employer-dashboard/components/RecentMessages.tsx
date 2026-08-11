import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { Button } from "@/components/ui/Button";
import { EMPLOYER_ROUTES } from "@/features/employer-company/constants";
import type { EmployerMessageSummary } from "../types/dashboard.types";

function formatRelative(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function RecentMessages({
  messages,
}: {
  messages: EmployerMessageSummary[];
}) {
  if (!messages.length) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No messages yet"
        description="Conversations with candidates will appear here."
        action={<Button href={EMPLOYER_ROUTES.messages}>View Messages</Button>}
      />
    );
  }

  return (
    <div className="min-w-0">
      <ul className="space-y-3">
        {messages.map((message) => (
          <li key={message.id} className="min-w-0">
            <Link
              href={`${EMPLOYER_ROUTES.messages}?conversation=${message.id}`}
              className="block min-w-0 overflow-hidden rounded-2xl border border-border bg-surface/40 px-3.5 py-3 transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 sm:px-4"
            >
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex items-start justify-between gap-2 sm:block">
                    <p className="truncate text-sm font-semibold text-text">
                      {message.candidate}
                    </p>
                    <p className="shrink-0 text-[11px] text-muted sm:hidden">
                      {formatRelative(message.lastMessageAt)}
                    </p>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {message.job}
                  </p>
                  <p className="mt-2 line-clamp-2 break-words text-xs text-muted sm:line-clamp-1">
                    {message.preview}
                  </p>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-[11px] text-muted">
                    {formatRelative(message.lastMessageAt)}
                  </p>
                  {message.unreadCount > 0 ? (
                    <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {message.unreadCount} new
                    </span>
                  ) : null}
                </div>
              </div>
              {message.unreadCount > 0 ? (
                <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary sm:hidden">
                  {message.unreadCount} new
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <Button
          href={EMPLOYER_ROUTES.messages}
          variant="secondary"
          className="w-full !py-2.5 text-xs"
        >
          View Messages
        </Button>
      </div>
    </div>
  );
}
