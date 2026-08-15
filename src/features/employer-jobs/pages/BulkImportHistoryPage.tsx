"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  History,
  Loader2,
  RefreshCw,
  Search,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { Skeleton, SkeletonCard } from "@/components/dashboard/shared/Skeleton";
import { EMPLOYER_JOB_ROUTES } from "../constants";
import { bulkImportHistoryService } from "../services/bulkImportHistoryService";
import { downloadBulkImportSessionReport } from "../lib/bulkErrorReport";
import type {
  BulkImportDateFilter,
  BulkImportHistoryResponse,
  BulkImportSession,
  BulkImportStatus,
} from "../types/bulkUpload.types";

const STATUS_FILTERS: { value: "all" | BulkImportStatus; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "completed", label: "Completed" },
  { value: "completed_with_warnings", label: "With Warnings" },
  { value: "failed", label: "Failed" },
  { value: "processing", label: "Processing" },
];

const DATE_FILTERS: { value: BulkImportDateFilter; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "7days", label: "Last 7 Days" },
  { value: "30days", label: "Last 30 Days" },
];

export function BulkImportStatusBadge({ status }: { status: BulkImportStatus }) {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
          <CheckCircle2 size={13} className="shrink-0" aria-hidden="true" />
          Completed
        </span>
      );
    case "completed_with_warnings":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          <AlertTriangle size={13} className="shrink-0" aria-hidden="true" />
          With Warnings
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
          <XCircle size={13} className="shrink-0" aria-hidden="true" />
          Failed
        </span>
      );
    case "processing":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
          <Loader2 size={13} className="animate-spin shrink-0" aria-hidden="true" />
          Processing
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-muted/20 px-2.5 py-1 text-xs font-semibold text-muted">
          {status}
        </span>
      );
  }
}

export function BulkImportHistoryPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | BulkImportStatus>("all");
  const [dateFilter, setDateFilter] = useState<BulkImportDateFilter>("all");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<BulkImportHistoryResponse | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMsg(null);

    const res = await bulkImportHistoryService.listImportHistory({
      search: search.trim() || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      dateRange: dateFilter !== "all" ? dateFilter : undefined,
      page,
      pageSize,
    });

    if (!res.success) {
      setIsError(true);
      setErrorMsg(res.error);
      setIsLoading(false);
      return;
    }

    setHistoryData(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    void fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, dateFilter, page]);

  const handleDownloadReport = async (session: BulkImportSession) => {
    setDownloadingId(session.id);
    try {
      const res = await bulkImportHistoryService.getImportDetails(session.id);
      if (res.success) {
        await downloadBulkImportSessionReport(res.data.session, res.data.rows);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const hasFilters = Boolean(search.trim()) || statusFilter !== "all" || dateFilter !== "all";

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href={EMPLOYER_JOB_ROUTES.list}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-primary transition-colors mb-2"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Jobs
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Bulk Upload History
          </h1>
          <p className="mt-1 text-sm text-muted">
            View previous Excel uploads and their import results.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button href={EMPLOYER_JOB_ROUTES.bulkUpload} variant="primary">
            <UploadCloud size={16} aria-hidden="true" />
            Bulk Upload Jobs
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by file name..."
            aria-label="Search by file name"
            className="w-full rounded-[var(--radius-input)] border border-border bg-input pl-10 pr-4 py-2 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <NativeSelect
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "all" | BulkImportStatus);
              setPage(1);
            }}
            aria-label="Filter by import status"
            className="w-44"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </NativeSelect>

          <NativeSelect
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value as BulkImportDateFilter);
              setPage(1);
            }}
            aria-label="Filter by date range"
            className="w-40"
          >
            {DATE_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </NativeSelect>

          {hasFilters && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setDateFilter("all");
                setPage(1);
              }}
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="hidden h-14 w-full md:block" />
          <SkeletonCard className="h-24 md:hidden" />
          <SkeletonCard className="h-24 md:hidden" />
          <SkeletonCard className="h-24 md:hidden" />
          <SkeletonCard className="hidden h-72 md:block" />
        </div>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
          <ErrorState
            title="We couldn't load your bulk upload history."
            description={errorMsg || "Please check your network connection and try again."}
            onRetry={fetchHistory}
          />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && historyData && historyData.items.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-soft">
          <EmptyState
            icon={FileSpreadsheet}
            title={hasFilters ? "No matching bulk uploads found" : "No bulk uploads yet"}
            description={
              hasFilters
                ? "Try adjusting your search or filters to find previous uploads."
                : "Your previous Excel job imports will appear here."
            }
            action={
              hasFilters ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setDateFilter("all");
                    setPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button href={EMPLOYER_JOB_ROUTES.bulkUpload} variant="primary">
                  <UploadCloud size={16} aria-hidden="true" />
                  Bulk Upload Jobs
                </Button>
              )
            }
          />
        </div>
      )}

      {/* History Data Table & Mobile Cards */}
      {!isLoading && !isError && historyData && historyData.items.length > 0 && (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto rounded-[var(--radius-card)] border border-border bg-card shadow-soft md:block">
            <table className="w-full text-left text-sm" role="table" aria-label="Bulk Upload History">
              <thead className="border-b border-border bg-card-secondary/60 text-xs font-semibold uppercase tracking-wider text-muted">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    File Name
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Uploaded By
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Date & Time
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-center">
                    Rows
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-center">
                    Created
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-center">
                    Skipped
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-center">
                    Failed
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {historyData.items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-card-secondary/30 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5 min-w-0 max-w-xs">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                          <FileSpreadsheet size={18} aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={EMPLOYER_JOB_ROUTES.bulkUploadDetails(item.id)}
                            className="block font-medium text-text hover:text-primary transition-colors truncate"
                            title={item.fileName}
                          >
                            {item.fileName}
                          </Link>
                          {item.fileSize ? (
                            <span className="text-xs text-muted">
                              {(item.fileSize / 1024).toFixed(0)} KB
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-text font-medium">
                      <span className="truncate block max-w-[130px]" title={item.uploaderName || ""}>
                        {item.uploaderName || "Team Member"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      <span className="block text-[11px] opacity-75">
                        {new Date(item.createdAt).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-center font-medium text-text">
                      {item.selectedRows}
                    </td>
                    <td className="px-3 py-4 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                      {item.createdCount}
                    </td>
                    <td className="px-3 py-4 text-center font-medium text-amber-600 dark:text-amber-400">
                      {item.skippedCount}
                    </td>
                    <td className="px-3 py-4 text-center font-medium text-rose-600 dark:text-rose-400">
                      {item.failedCount}
                    </td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <BulkImportStatusBadge status={item.status} />
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <Button
                          href={EMPLOYER_JOB_ROUTES.bulkUploadDetails(item.id)}
                          variant="secondary"
                          size="sm"
                          aria-label={`View details for ${item.fileName}`}
                        >
                          <Eye size={14} aria-hidden="true" />
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadReport(item)}
                          disabled={downloadingId === item.id}
                          aria-label={`Download report for ${item.fileName}`}
                          title="Download Excel Report"
                        >
                          {downloadingId === item.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Download size={14} />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="grid gap-3.5 md:hidden">
            {historyData.items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                      <FileSpreadsheet size={18} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={EMPLOYER_JOB_ROUTES.bulkUploadDetails(item.id)}
                        className="font-bold text-sm text-text hover:text-primary transition-colors block truncate"
                      >
                        {item.fileName}
                      </Link>
                      <p className="text-xs text-muted">
                        by {item.uploaderName || "Team Member"} •{" "}
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <BulkImportStatusBadge status={item.status} />
                </div>

                <div className="grid grid-cols-4 gap-2 rounded-xl bg-card-secondary/40 p-2.5 text-center text-xs">
                  <div>
                    <span className="block text-muted">Rows</span>
                    <span className="font-semibold text-text">{item.selectedRows}</span>
                  </div>
                  <div>
                    <span className="block text-muted">Created</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {item.createdCount}
                    </span>
                  </div>
                  <div>
                    <span className="block text-muted">Skipped</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {item.skippedCount}
                    </span>
                  </div>
                  <div>
                    <span className="block text-muted">Failed</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      {item.failedCount}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadReport(item)}
                    disabled={downloadingId === item.id}
                    className="text-xs"
                  >
                    {downloadingId === item.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Download size={13} />
                    )}
                    Report
                  </Button>
                  <Button
                    href={EMPLOYER_JOB_ROUTES.bulkUploadDetails(item.id)}
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                  >
                    <Eye size={13} aria-hidden="true" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {historyData.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/70 pt-4 text-xs text-muted">
              <span>
                Showing {(historyData.page - 1) * historyData.pageSize + 1} to{" "}
                {Math.min(
                  historyData.page * historyData.pageSize,
                  historyData.totalCount
                )}{" "}
                of {historyData.totalCount} uploads
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={14} aria-hidden="true" />
                  Prev
                </Button>
                <span className="font-medium text-text px-2">
                  Page {historyData.page} of {historyData.totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(historyData.totalPages, p + 1))
                  }
                  disabled={page >= historyData.totalPages}
                  aria-label="Next Page"
                >
                  Next
                  <ChevronRight size={14} aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
