"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  Search,
  User,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { Skeleton, SkeletonCard } from "@/components/dashboard/shared/Skeleton";
import { EMPLOYER_JOB_ROUTES } from "../constants";
import { bulkImportHistoryService } from "../services/bulkImportHistoryService";
import { downloadBulkImportSessionReport } from "../lib/bulkErrorReport";
import { BulkImportStatusBadge } from "./BulkImportHistoryPage";
import type {
  BulkImportRowRecord,
  BulkImportRowStatus,
  BulkImportSession,
} from "../types/bulkUpload.types";

interface BulkImportDetailsPageProps {
  importId: string;
}

type TabType = "all" | BulkImportRowStatus;

export function BulkImportDetailsPage({ importId }: BulkImportDetailsPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [session, setSession] = useState<BulkImportSession | null>(null);
  const [rows, setRows] = useState<BulkImportRowRecord[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  // Client-side filtering & search on loaded session rows
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const loadData = async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMsg(null);

    const res = await bulkImportHistoryService.getImportDetails(importId);
    if (!res.success) {
      setIsError(true);
      setErrorMsg(res.error);
      setIsLoading(false);
      return;
    }

    setSession(res.data.session);
    setRows(res.data.rows);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importId]);

  const handleDownload = async () => {
    if (!session) return;
    setIsDownloading(true);
    try {
      await downloadBulkImportSessionReport(session, rows);
    } finally {
      setIsDownloading(false);
    }
  };

  // Filter and search
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (activeTab === "created" && r.status !== "created") return false;
      if (activeTab === "skipped" && r.status !== "skipped") return false;
      if (activeTab === "failed" && r.status !== "failed") return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = (r.jobTitle || "").toLowerCase().includes(q);
      const rowMatch = String(r.rowNumber).includes(q);
      const reasonMatch = (r.reason || "").toLowerCase().includes(q);

      return titleMatch || rowMatch || reasonMatch;
    });
  }, [rows, activeTab, searchQuery]);

  // Paginate filtered rows
  const totalFilteredCount = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / pageSize));
  const paginatedRows = useMemo(() => {
    const from = (page - 1) * pageSize;
    return filteredRows.slice(from, from + pageSize);
  }, [filteredRows, page, pageSize]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    let created = 0;
    let skipped = 0;
    let failed = 0;
    for (const r of rows) {
      if (r.status === "created") created++;
      else if (r.status === "skipped") skipped++;
      else if (r.status === "failed") failed++;
    }
    return {
      all: rows.length,
      created,
      skipped,
      failed,
    };
  }, [rows]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 pb-12">
        <Skeleton className="h-6 w-44" />
        <SkeletonCard className="h-44" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SkeletonCard className="h-24" />
          <SkeletonCard className="h-24" />
          <SkeletonCard className="h-24" />
          <SkeletonCard className="h-24" />
        </div>
        <SkeletonCard className="h-72" />
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-8">
        <Link
          href={EMPLOYER_JOB_ROUTES.bulkUploadHistory}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Bulk Upload History
        </Link>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
          <ErrorState
            title="We couldn't load this bulk import details."
            description={errorMsg || "Import session not found or you do not have permission to view it."}
            onRetry={loadData}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Back link */}
      <div>
        <Link
          href={EMPLOYER_JOB_ROUTES.bulkUploadHistory}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Bulk Upload History
        </Link>
      </div>

      {/* Session Summary Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileSpreadsheet size={28} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-text sm:text-2xl truncate">
                  {session.fileName}
                </h1>
                <BulkImportStatusBadge status={session.status} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <User size={14} aria-hidden="true" />
                  Uploaded by <strong className="font-semibold text-text">{session.uploaderName}</strong>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} aria-hidden="true" />
                  {new Date(session.createdAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                {session.fileSize ? (
                  <span>{(session.fileSize / 1024).toFixed(0)} KB</span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <Button
              type="button"
              variant="secondary"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <Download size={16} aria-hidden="true" />
              )}
              Download Excel Report
            </Button>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-card-secondary/40 p-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Total Rows
            </span>
            <div className="mt-1 text-2xl font-bold tracking-tight text-text">
              {session.selectedRows}
            </div>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Created
            </span>
            <div className="mt-1 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {session.createdCount}
            </div>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              Skipped
            </span>
            <div className="mt-1 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {session.skippedCount}
            </div>
          </div>
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300">
              Failed
            </span>
            <div className="mt-1 text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {session.failedCount}
            </div>
          </div>
        </div>
      </div>

      {/* Row Results Section */}
      <div className="space-y-4">
        {/* Tab filters and search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab("all");
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted hover:text-text"
              }`}
            >
              All ({tabCounts.all})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("created");
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === "created"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted hover:text-text"
              }`}
            >
              Created ({tabCounts.created})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("skipped");
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === "skipped"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-muted hover:text-text"
              }`}
            >
              Skipped ({tabCounts.skipped})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("failed");
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === "failed"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-muted hover:text-text"
              }`}
            >
              Failed ({tabCounts.failed})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by title, row, or reason..."
              className="w-full rounded-[var(--radius-input)] border border-border bg-input pl-9 pr-3 py-1.5 text-xs text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Rows Table */}
        {totalFilteredCount === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-soft">
            <p className="text-sm font-semibold text-text">No rows match your criteria.</p>
            <p className="mt-1 text-xs text-muted">Try clearing the search or switching tabs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border bg-card shadow-soft">
            <table className="w-full text-left text-sm" role="table" aria-label="Import Row Results">
              <thead className="border-b border-border bg-card-secondary/60 text-xs font-semibold uppercase tracking-wider text-muted">
                <tr>
                  <th scope="col" className="w-20 px-4 py-3.5 text-center">
                    Row #
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Job Title
                  </th>
                  <th scope="col" className="w-32 px-4 py-3.5 text-center">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Reason / Details
                  </th>
                  <th scope="col" className="w-28 px-4 py-3.5 text-right">
                    Job
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedRows.map((r) => (
                  <tr key={r.id} className="hover:bg-card-secondary/30 transition-colors">
                    <td className="px-4 py-3.5 text-center font-mono text-xs font-medium text-muted">
                      {r.rowNumber}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-text">
                      {r.jobTitle}
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {r.status === "created" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                          <CheckCircle2 size={12} aria-hidden="true" />
                          Created
                        </span>
                      )}
                      {r.status === "skipped" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                          <AlertTriangle size={12} aria-hidden="true" />
                          Skipped
                        </span>
                      )}
                      {r.status === "failed" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                          <XCircle size={12} aria-hidden="true" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted">
                      {r.reason ? (
                        <span>{r.reason}</span>
                      ) : r.status === "created" ? (
                        <span className="text-emerald-700 dark:text-emerald-400">
                          Job created successfully as Draft.
                        </span>
                      ) : (
                        <span className="text-muted/60">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      {r.jobId ? (
                        <Link
                          href={EMPLOYER_JOB_ROUTES.details(r.jobId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          View Job
                          <ExternalLink size={12} aria-hidden="true" />
                        </Link>
                      ) : (
                        <span className="text-xs text-muted/50">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/70 pt-4 text-xs text-muted">
            <span>
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, totalFilteredCount)} of {totalFilteredCount} rows
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft size={14} aria-hidden="true" />
                Prev
              </Button>
              <span className="font-medium text-text px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight size={14} aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
