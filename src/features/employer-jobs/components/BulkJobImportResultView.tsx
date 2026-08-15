"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  History,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { downloadBulkImportResultReport } from "../lib/bulkErrorReport";
import { EMPLOYER_JOB_ROUTES } from "../constants";
import type {
  BulkImportResult,
  BulkImportResultFilterTab,
  ImportResultRow,
} from "../types/bulkUpload.types";

interface BulkJobImportResultViewProps {
  result: BulkImportResult;
  fileName?: string;
  onStartOver: () => void;
}

type DisplayedResultRow = {
  rowNumber: number;
  jobTitle: string;
  status: "created" | "skipped" | "failed";
  reason?: string;
  jobId?: string;
};

export function BulkJobImportResultView({
  result,
  fileName = "Excel Upload",
  onStartOver,
}: BulkJobImportResultViewProps) {
  const [activeTab, setActiveTab] = useState<BulkImportResultFilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const createdCount = result.created.length;
  const skippedCount = result.skipped.length;
  const failedCount = result.failed.length;
  const totalCount = result.totalSelected;

  const allRows: DisplayedResultRow[] = useMemo(() => {
    const list: DisplayedResultRow[] = [
      ...result.created.map((r) => ({
        ...r,
        status: "created" as const,
        reason: "Job created successfully as Draft.",
      })),
      ...result.skipped.map((r) => ({
        ...r,
        status: "skipped" as const,
      })),
      ...result.failed.map((r) => ({
        ...r,
        status: "failed" as const,
      })),
    ];
    return list.sort((a, b) => a.rowNumber - b.rowNumber);
  }, [result]);

  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      if (activeTab === "created" && row.status !== "created") return false;
      if (activeTab === "skipped" && row.status !== "skipped") return false;
      if (activeTab === "failed" && row.status !== "failed") return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = (row.jobTitle || "").toLowerCase().includes(q);
      const rowMatch = String(row.rowNumber).includes(q);
      const reasonMatch = (row.reason || "").toLowerCase().includes(q);

      return titleMatch || rowMatch || reasonMatch;
    });
  }, [allRows, activeTab, searchQuery]);

  const handleDownloadReport = async () => {
    setIsDownloading(true);
    try {
      await downloadBulkImportResultReport(result, fileName);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft sm:p-8">
        <div className="flex flex-col items-center text-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-xs ${
              failedCount === 0 && createdCount > 0
                ? "bg-success/15 text-success"
                : createdCount > 0
                ? "bg-warning/20 text-warning-foreground"
                : "bg-error/15 text-error"
            }`}
          >
            {failedCount === 0 && createdCount > 0 ? (
              <CheckCircle2 size={36} aria-hidden="true" />
            ) : createdCount > 0 ? (
              <AlertTriangle size={36} aria-hidden="true" />
            ) : (
              <XCircle size={36} aria-hidden="true" />
            )}
          </div>

          <h2 className="mt-4 text-2xl font-bold tracking-tight text-text sm:text-3xl">
            {createdCount > 0
              ? `${createdCount} Job${createdCount === 1 ? "" : "s"} Created Successfully`
              : "Import Completed"}
          </h2>

          <p className="mt-2 max-w-lg text-sm text-muted">
            {createdCount > 0
              ? `Created ${createdCount} new draft job posting${
                  createdCount === 1 ? "" : "s"
                } for your company from ${fileName}.`
              : `No new jobs were created from ${fileName}.`}
          </p>

          {/* Metric Cards Grid */}
          <div className="mt-6 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === "created" ? "all" : "created")}
              className={`flex flex-col rounded-xl border p-4 text-left transition-all ${
                activeTab === "created"
                  ? "border-success bg-success/15 ring-2 ring-success/40"
                  : "border-border bg-surface hover:border-success/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-success">
                  Created
                </span>
                <CheckCircle2 size={16} className="text-success" />
              </div>
              <span className="mt-2 text-2xl font-bold tracking-tight text-success">
                {createdCount}
              </span>
              <span className="mt-0.5 text-xs text-muted">Saved as draft</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab(activeTab === "skipped" ? "all" : "skipped")}
              className={`flex flex-col rounded-xl border p-4 text-left transition-all ${
                activeTab === "skipped"
                  ? "border-warning bg-warning/20 ring-2 ring-warning/40"
                  : "border-border bg-surface hover:border-warning/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-warning-foreground">
                  Skipped
                </span>
                <AlertTriangle size={16} className="text-warning-foreground" />
              </div>
              <span className="mt-2 text-2xl font-bold tracking-tight text-warning-foreground">
                {skippedCount}
              </span>
              <span className="mt-0.5 text-xs text-muted">Existing duplicates</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab(activeTab === "failed" ? "all" : "failed")}
              className={`flex flex-col rounded-xl border p-4 text-left transition-all ${
                activeTab === "failed"
                  ? "border-error bg-error/15 ring-2 ring-error/40"
                  : "border-border bg-surface hover:border-error/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-error">
                  Failed
                </span>
                <XCircle size={16} className="text-error" />
              </div>
              <span className="mt-2 text-2xl font-bold tracking-tight text-error">
                {failedCount}
              </span>
              <span className="mt-0.5 text-xs text-muted">Server errors</span>
            </button>
          </div>
        </div>
      </div>

      {/* Breakdown Table & Action Toolbar */}
      <div className="space-y-4 rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-soft sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Tab Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: "all", label: "All Items", count: totalCount },
                { id: "created", label: "Created", count: createdCount },
                { id: "skipped", label: "Skipped", count: skippedCount },
                { id: "failed", label: "Failed", count: failedCount },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-soft"
                    : "bg-surface text-muted hover:bg-surface/80 hover:text-text"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    activeTab === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-border text-muted"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Download Buttons */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Search result rows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface py-1.5 pl-8 pr-3 text-xs text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={handleDownloadReport}
              disabled={isDownloading}
              className="shrink-0 !py-1.5 !px-3 text-xs"
            >
              <Download size={13} />
              Export Results
            </Button>
          </div>
        </div>

        {/* Results Table */}
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/75 text-muted">
                <tr>
                  <th className="w-16 px-3 py-2.5 font-semibold text-text">Row</th>
                  <th className="px-3 py-2.5 font-semibold text-text">Job Title</th>
                  <th className="w-28 px-3 py-2.5 text-center font-semibold text-text">Status</th>
                  <th className="px-3 py-2.5 font-semibold text-text">Details / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted">
                      <p className="text-sm font-medium">No results match your filter</p>
                      <p className="mt-1 text-xs">
                        Try selecting a different status tab or clearing the search query.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr
                      key={`${row.status}-${row.rowNumber}`}
                      className={`transition-colors ${
                        row.status === "created"
                          ? "hover:bg-success/5"
                          : row.status === "skipped"
                          ? "hover:bg-warning/5"
                          : "hover:bg-error/5"
                      }`}
                    >
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono font-semibold text-text">
                        Row {row.rowNumber}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-text">
                        {row.jobTitle || "(Untitled Job)"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-center">
                        {row.status === "created" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-[11px] font-semibold text-success">
                            <CheckCircle2 size={12} aria-hidden="true" />
                            Created
                          </span>
                        ) : row.status === "skipped" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/20 px-2.5 py-0.5 text-[11px] font-semibold text-warning-foreground">
                            <AlertTriangle size={12} aria-hidden="true" />
                            Skipped
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-error/15 px-2.5 py-0.5 text-[11px] font-semibold text-error">
                            <XCircle size={12} aria-hidden="true" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-muted">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={
                              row.status === "created"
                                ? "text-success/90"
                                : row.status === "skipped"
                                ? "text-warning-foreground font-medium"
                                : "text-error font-medium"
                            }
                          >
                            {row.reason}
                          </span>
                          {row.jobId && (
                            <Link
                              href={EMPLOYER_JOB_ROUTES.details(row.jobId)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 shrink-0 font-semibold text-primary hover:underline ml-2"
                            >
                              View
                              <ExternalLink size={11} aria-hidden="true" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col-reverse gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="secondary"
          onClick={onStartOver}
          className="w-full sm:w-auto"
        >
          <RotateCcw size={14} />
          Upload Another Excel File
        </Button>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Button
            variant="secondary"
            href={
              result.importId
                ? EMPLOYER_JOB_ROUTES.bulkUploadDetails(result.importId)
                : EMPLOYER_JOB_ROUTES.bulkUploadHistory
            }
            className="w-full sm:w-auto"
          >
            <History size={14} aria-hidden="true" />
            View in Upload History
          </Button>

          <Button
            variant="primary"
            href={EMPLOYER_JOB_ROUTES.list}
            className="w-full sm:w-auto min-w-[160px]"
          >
            View Job Postings
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
