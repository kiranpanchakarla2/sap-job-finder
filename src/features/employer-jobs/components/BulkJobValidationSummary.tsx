"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  XCircle,
} from "lucide-react";
import type { BulkJobFileValidationResult } from "../types/bulkUpload.types";

interface BulkJobValidationSummaryProps {
  result: BulkJobFileValidationResult;
  selectedFilter: "all" | "valid" | "warning" | "error";
  onFilterChange: (filter: "all" | "valid" | "warning" | "error") => void;
}

export function BulkJobValidationSummary({
  result,
  selectedFilter,
  onFilterChange,
}: BulkJobValidationSummaryProps) {
  const {
    fileName,
    totalRows,
    validCount,
    warningCount,
    errorCount,
    fileErrors,
    fileWarnings,
  } = result;

  return (
    <div className="space-y-4">
      {/* File-Level Blocking Errors Banner */}
      {fileErrors.length > 0 && (
        <div
          role="alert"
          className="rounded-[var(--radius-card)] border border-error/30 bg-error/10 p-4 text-error shadow-soft sm:p-5"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-error/20 text-error">
              <XCircle size={20} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-error">
                Spreadsheet Structure Issues Detected
              </h3>
              <p className="mt-1 text-xs text-error/90">
                Please fix the following header/file issues in{" "}
                <span className="font-semibold">{fileName}</span> and re-upload:
              </p>
              <ul className="mt-2.5 list-inside list-disc space-y-1 text-xs text-error/90">
                {fileErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* File-Level Warnings Banner */}
      {fileWarnings.length > 0 && (
        <div
          role="status"
          className="rounded-[var(--radius-card)] border border-warning/30 bg-warning/10 p-4 text-warning-foreground shadow-soft sm:p-5"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/20 text-warning-foreground">
              <AlertTriangle size={20} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-text">
                Spreadsheet Notice
              </h3>
              <ul className="mt-1 list-inside list-disc space-y-1 text-xs text-muted">
                {fileWarnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Validation Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Total Jobs */}
        <button
          type="button"
          onClick={() => onFilterChange("all")}
          className={`flex flex-col rounded-[var(--radius-card)] border p-4 text-left transition-all ${
            selectedFilter === "all"
              ? "border-primary bg-primary/5 shadow-soft ring-2 ring-primary/20"
              : "border-border bg-card hover:border-primary/40 hover:bg-surface/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Total Jobs
            </span>
            <Layers size={16} className="text-primary" />
          </div>
          <span className="mt-2 text-2xl font-bold tracking-tight text-text">
            {totalRows}
          </span>
          <span className="mt-1 text-[11px] text-muted">
            {totalRows === 1 ? "1 row parsed" : `${totalRows} rows parsed`}
          </span>
        </button>

        {/* Ready Jobs */}
        <button
          type="button"
          onClick={() => onFilterChange("valid")}
          className={`flex flex-col rounded-[var(--radius-card)] border p-4 text-left transition-all ${
            selectedFilter === "valid"
              ? "border-success bg-success/10 shadow-soft ring-2 ring-success/30"
              : "border-border bg-card hover:border-success/40 hover:bg-surface/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-success">
              Ready
            </span>
            <CheckCircle2 size={16} className="text-success" />
          </div>
          <span className="mt-2 text-2xl font-bold tracking-tight text-success">
            {validCount}
          </span>
          <span className="mt-1 text-[11px] text-muted">
            100% valid rows
          </span>
        </button>

        {/* Warnings */}
        <button
          type="button"
          onClick={() => onFilterChange("warning")}
          className={`flex flex-col rounded-[var(--radius-card)] border p-4 text-left transition-all ${
            selectedFilter === "warning"
              ? "border-warning bg-warning/15 shadow-soft ring-2 ring-warning/30"
              : "border-border bg-card hover:border-warning/40 hover:bg-surface/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-warning-foreground">
              Warnings
            </span>
            <AlertCircle size={16} className="text-warning-foreground" />
          </div>
          <span className="mt-2 text-2xl font-bold tracking-tight text-warning-foreground">
            {warningCount}
          </span>
          <span className="mt-1 text-[11px] text-muted">
            Non-blocking notices
          </span>
        </button>

        {/* Errors */}
        <button
          type="button"
          onClick={() => onFilterChange("error")}
          className={`flex flex-col rounded-[var(--radius-card)] border p-4 text-left transition-all ${
            selectedFilter === "error"
              ? "border-error bg-error/10 shadow-soft ring-2 ring-error/30"
              : "border-border bg-card hover:border-error/40 hover:bg-surface/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-error">
              Errors
            </span>
            <XCircle size={16} className="text-error" />
          </div>
          <span className="mt-2 text-2xl font-bold tracking-tight text-error">
            {errorCount}
          </span>
          <span className="mt-1 text-[11px] text-muted">
            Blocking issues
          </span>
        </button>
      </div>
    </div>
  );
}
