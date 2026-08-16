"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  History,
  Info,
  Paperclip,
  PlusCircle,
  RefreshCw,
  Tag,
  X,
} from "lucide-react";
import { formatFileSize } from "@/lib/validations/contact";
import { CONTACT_REQUEST_CATEGORIES } from "@/lib/constants";
import { getMyContactRequests } from "@/services/contactService";
import type { ContactRequest, ContactRequestStatus } from "@/types/contact";

export interface EmployerRequestHistoryProps {
  onNewRequest?: () => void;
}

function getStatusBadge(status: ContactRequestStatus) {
  switch (status) {
    case "new":
      return {
        label: "New",
        bg: "bg-blue-500/10",
        text: "text-blue-500",
        border: "border-blue-500/20",
        icon: Clock,
      };
    case "in_progress":
      return {
        label: "In Progress",
        bg: "bg-amber-500/10",
        text: "text-amber-500",
        border: "border-amber-500/20",
        icon: RefreshCw,
      };
    case "resolved":
      return {
        label: "Resolved",
        bg: "bg-emerald-500/10",
        text: "text-emerald-500",
        border: "border-emerald-500/20",
        icon: CheckCircle2,
      };
    case "closed":
    default:
      return {
        label: "Closed",
        bg: "bg-gray-500/10",
        text: "text-gray-500",
        border: "border-gray-500/20",
        icon: CheckCircle2,
      };
  }
}

function getCategoryLabel(categoryValue: string): string {
  const match = CONTACT_REQUEST_CATEGORIES.find((c) => c.value === categoryValue);
  return match?.label || categoryValue;
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export function EmployerRequestHistory({ onNewRequest }: EmployerRequestHistoryProps) {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyContactRequests();
      if (!res.success) {
        setError(res.error || "Failed to load company support requests.");
        setRequests([]);
      } else {
        setRequests(res.data || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred while loading requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text sm:text-2xl">
            My Support Requests
          </h2>
          <p className="text-sm text-muted">
            Track inquiries, bulk import questions, and technical requests submitted from your company account.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchRequests}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-text shadow-soft transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-50"
            title="Refresh requests"
            aria-label="Refresh requests"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            <span>Refresh</span>
          </button>

          {onNewRequest ? (
            <button
              type="button"
              onClick={onNewRequest}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              <PlusCircle size={14} aria-hidden="true" />
              <span>New Request</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Error Alert */}
      {error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-semibold">Unable to load requests</p>
            <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchRequests}
            className="text-xs font-semibold underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      ) : null}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-border bg-card p-5 shadow-soft"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-48 rounded bg-border/60" />
                <div className="h-6 w-20 rounded-full bg-border/60" />
              </div>
              <div className="mt-3 flex items-center gap-4">
                <div className="h-3 w-28 rounded bg-border/40" />
                <div className="h-3 w-36 rounded bg-border/40" />
              </div>
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        /* Empty State */
        <div className="rounded-[var(--radius-card)] border border-border bg-card p-8 sm:p-12 text-center shadow-soft">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <History size={28} aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-text">No support requests yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Have a question about your job postings, Excel bulk imports, talent search, or billing?
            Send us a message and our support team will help.
          </p>
          {onNewRequest ? (
            <div className="mt-6">
              <button
                type="button"
                onClick={onNewRequest}
                className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              >
                <PlusCircle size={16} aria-hidden="true" />
                <span>Submit Your First Request</span>
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        /* Requests List */
        <div className="space-y-3">
          {requests.map((req) => {
            const statusBadge = getStatusBadge(req.status);
            const StatusIcon = statusBadge.icon;
            const categoryLabel = getCategoryLabel(req.category);

            return (
              <div
                key={req.id}
                onClick={() => setSelectedRequest(req)}
                className="group relative cursor-pointer rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:border-primary/40 hover:bg-surface focus-within:ring-2 focus-within:ring-primary/20"
                tabIndex={0}
                role="button"
                aria-label={`View details for request: ${req.subject}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedRequest(req);
                  }
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-text group-hover:text-primary transition-colors line-clamp-1">
                        {req.subject}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                      <span className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-0.5 font-medium text-text border border-border">
                        <Tag size={11} aria-hidden="true" />
                        <span>{categoryLabel}</span>
                      </span>

                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} aria-hidden="true" />
                        <span>{formatDate(req.created_at)}</span>
                      </span>

                      {req.attachment_name ? (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <Paperclip size={12} aria-hidden="true" />
                          <span className="truncate max-w-[140px]">{req.attachment_name}</span>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                    >
                      <StatusIcon size={12} aria-hidden="true" />
                      <span>{statusBadge.label}</span>
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-xs text-muted line-clamp-2 leading-relaxed">
                  {req.message}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="employer-request-details-title"
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-lift sm:p-8 overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                      getStatusBadge(selectedRequest.status).bg
                    } ${getStatusBadge(selectedRequest.status).text} ${
                      getStatusBadge(selectedRequest.status).border
                    }`}
                  >
                    <span>{getStatusBadge(selectedRequest.status).label}</span>
                  </span>
                  <span className="text-xs text-muted">
                    {formatDate(selectedRequest.created_at)}
                  </span>
                </div>
                <h3
                  id="employer-request-details-title"
                  className="text-lg font-bold text-text break-words"
                >
                  {selectedRequest.subject}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                aria-label="Close request details"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-sm">
              {/* Category Info */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Topic / Category
                </span>
                <p className="mt-0.5 font-medium text-text">
                  {getCategoryLabel(selectedRequest.category)}
                </p>
              </div>

              {/* Message */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Message Details
                </span>
                <div className="mt-1.5 rounded-xl border border-border bg-surface p-4 text-xs sm:text-sm text-text leading-relaxed whitespace-pre-wrap break-words">
                  {selectedRequest.message}
                </div>
              </div>

              {/* Attachment if present */}
              {selectedRequest.attachment_name ? (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Attachment
                  </span>
                  <div className="mt-1.5 flex items-center justify-between rounded-xl border border-border bg-surface p-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                        <FileCheck size={16} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-text">
                          {selectedRequest.attachment_name}
                        </p>
                        {selectedRequest.attachment_size ? (
                          <p className="text-[11px] text-muted">
                            {formatFileSize(selectedRequest.attachment_size)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Safe Status Notice */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex items-start gap-2.5 text-xs text-text">
                <Info size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <p className="leading-relaxed text-muted">
                  Our employer support team reviews requests in the order received. Responses are sent to your
                  registered company email address (
                  <span className="font-semibold text-text">{selectedRequest.email}</span>).
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="rounded-xl bg-surface border border-border px-5 py-2.5 text-xs font-semibold text-text hover:bg-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
