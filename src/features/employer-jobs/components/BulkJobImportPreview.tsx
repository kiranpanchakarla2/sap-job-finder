"use client";

import { useId, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Layers,
  RotateCcw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { downloadBulkJobErrorReport } from "../lib/bulkErrorReport";
import { BulkImportConfirmDialog } from "./BulkImportConfirmDialog";
import type {
  BulkImportFilterTab,
  BulkJobFileValidationResult,
  BulkJobValidationRow,
  RowValidationStatus,
} from "../types/bulkUpload.types";

interface BulkJobImportPreviewProps {
  validationResult: BulkJobFileValidationResult;
  isImporting?: boolean;
  onBack: () => void;
  onStartOver: () => void;
  onConfirmImport: (approvedRows: BulkJobValidationRow[]) => void;
}

export function BulkJobImportPreview({
  validationResult,
  isImporting = false,
  onBack,
  onStartOver,
  onConfirmImport,
}: BulkJobImportPreviewProps) {
  const [removedRowNumbers, setRemovedRowNumbers] = useState<Set<number>>(
    new Set()
  );
  // Default selected rows: all non-error rows
  const [selectedRowNumbers, setSelectedRowNumbers] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    for (const row of validationResult.rows) {
      if (row.status !== "error") {
        initial.add(row.rowNumber);
      }
    }
    return initial;
  });

  const [activeFilter, setActiveFilter] = useState<BulkImportFilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [rowPendingRemoval, setRowPendingRemoval] = useState<number | null>(null);

  // Active rows (excluding removed rows)
  const activeRows = useMemo(() => {
    return validationResult.rows.filter(
      (row) => !removedRowNumbers.has(row.rowNumber)
    );
  }, [validationResult.rows, removedRowNumbers]);

  // Derived counts from active rows
  const readyRows = useMemo(
    () => activeRows.filter((r) => r.status === "valid"),
    [activeRows]
  );
  const warningRows = useMemo(
    () => activeRows.filter((r) => r.status === "warning"),
    [activeRows]
  );
  const errorRows = useMemo(
    () => activeRows.filter((r) => r.status === "error"),
    [activeRows]
  );

  const readyCount = readyRows.length;
  const warningCount = warningRows.length;
  const errorCount = errorRows.length;
  const totalCount = activeRows.length;

  // Selected counts
  const selectedRows = useMemo(() => {
    return activeRows.filter(
      (r) => r.status !== "error" && selectedRowNumbers.has(r.rowNumber)
    );
  }, [activeRows, selectedRowNumbers]);

  const selectedCount = selectedRows.length;
  const selectedWarningRows = useMemo(() => {
    return selectedRows.filter((r) => r.status === "warning");
  }, [selectedRows]);
  const selectedWarningsCount = selectedWarningRows.length;

  const requiresWarningAcknowledgement = selectedWarningsCount > 0;
  const canProceedToConfirmation =
    selectedCount > 0 &&
    (!requiresWarningAcknowledgement || warningAcknowledged);

  // Filtered rows for the view
  const displayedRows = useMemo(() => {
    return activeRows.filter((row) => {
      // 1. Status Filter
      if (activeFilter === "valid" && row.status !== "valid") return false;
      if (activeFilter === "warning" && row.status !== "warning") return false;
      if (activeFilter === "error" && row.status !== "error") return false;

      // 2. Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = (row.data.title || "").toLowerCase().includes(q);
      const moduleMatch = (row.data.sapModule || "").toLowerCase().includes(q);
      const locMatch = (row.data.location || "").toLowerCase().includes(q);
      const rowNumMatch = String(row.rowNumber).includes(q);

      return titleMatch || moduleMatch || locMatch || rowNumMatch;
    });
  }, [activeRows, activeFilter, searchQuery]);

  // Selection actions
  const toggleRowSelected = (rowNumber: number, status: RowValidationStatus) => {
    if (status === "error") return; // Error rows can never be selected
    setSelectedRowNumbers((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) {
        next.delete(rowNumber);
      } else {
        next.add(rowNumber);
      }
      return next;
    });
  };

  const selectAllEligible = () => {
    const next = new Set<number>();
    for (const r of activeRows) {
      if (r.status !== "error") {
        next.add(r.rowNumber);
      }
    }
    setSelectedRowNumbers(next);
  };

  const deselectAll = () => {
    setSelectedRowNumbers(new Set());
  };

  // Row removal
  const handleRemoveRow = (rowNumber: number) => {
    setRemovedRowNumbers((prev) => new Set(prev).add(rowNumber));
    setSelectedRowNumbers((prev) => {
      const next = new Set(prev);
      next.delete(rowNumber);
      return next;
    });
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.delete(rowNumber);
      return next;
    });
    setRowPendingRemoval(null);
  };

  // Row expand / collapse
  const toggleRowExpanded = (rowNumber: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) {
        next.delete(rowNumber);
      } else {
        next.add(rowNumber);
      }
      return next;
    });
  };

  const expandAllDisplayed = () => {
    const ids = displayedRows.map((r) => r.rowNumber);
    setExpandedRows(new Set(ids));
  };

  const collapseAll = () => {
    setExpandedRows(new Set());
  };

  // Error report download
  const handleDownloadReport = async () => {
    setIsDownloadingReport(true);
    try {
      await downloadBulkJobErrorReport(
        validationResult.rows,
        validationResult.fileName
      );
    } finally {
      setIsDownloadingReport(false);
    }
  };

  // Confirmation trigger
  const handleConfirmImport = () => {
    setIsConfirmDialogOpen(false);
    // Pass only approved, non-removed, selected rows to future Sprint 7D import layer
    onConfirmImport(selectedRows);
  };

  const renderStatusBadge = (status: RowValidationStatus) => {
    switch (status) {
      case "valid":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
            <CheckCircle2 size={13} aria-hidden="true" />
            Ready
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/20 px-2.5 py-1 text-xs font-semibold text-warning-foreground">
            <AlertTriangle size={13} aria-hidden="true" />
            Warning
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-error/15 px-2.5 py-1 text-xs font-semibold text-error">
            <XCircle size={13} aria-hidden="true" />
            Error
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text sm:text-2xl">
            Review & Confirm
          </h2>
          <p className="mt-1 text-sm text-muted">
            Review the jobs below before continuing. Jobs with errors cannot be imported.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onStartOver}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted hover:text-text hover:bg-muted/10 transition-colors"
          >
            <RotateCcw size={14} />
            Upload Another File
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {/* Ready Card */}
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === "valid" ? "all" : "valid")}
          className={`flex flex-col rounded-[var(--radius-card)] border p-4 text-left transition-all ${
            activeFilter === "valid"
              ? "border-success bg-success/15 shadow-soft ring-2 ring-success/40"
              : "border-border bg-card hover:border-success/40 hover:bg-surface/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-success">
              Ready
            </span>
            <CheckCircle2 size={18} className="text-success" />
          </div>
          <span className="mt-2 text-3xl font-bold tracking-tight text-success">
            {readyCount}
          </span>
          <span className="mt-1 text-xs text-muted">
            {readyCount === 1 ? "1 job ready" : `${readyCount} jobs ready to import`}
          </span>
        </button>

        {/* Warnings Card */}
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === "warning" ? "all" : "warning")}
          className={`flex flex-col rounded-[var(--radius-card)] border p-4 text-left transition-all ${
            activeFilter === "warning"
              ? "border-warning bg-warning/20 shadow-soft ring-2 ring-warning/40"
              : "border-border bg-card hover:border-warning/40 hover:bg-surface/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-warning-foreground">
              Warnings
            </span>
            <AlertTriangle size={18} className="text-warning-foreground" />
          </div>
          <span className="mt-2 text-3xl font-bold tracking-tight text-warning-foreground">
            {warningCount}
          </span>
          <span className="mt-1 text-xs text-muted">
            {warningCount === 1 ? "1 job with notices" : `${warningCount} jobs with notices`}
          </span>
        </button>

        {/* Errors Card */}
        <button
          type="button"
          onClick={() => setActiveFilter(activeFilter === "error" ? "all" : "error")}
          className={`flex flex-col rounded-[var(--radius-card)] border p-4 text-left transition-all ${
            activeFilter === "error"
              ? "border-error bg-error/15 shadow-soft ring-2 ring-error/40"
              : "border-border bg-card hover:border-error/40 hover:bg-surface/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-error">
              Errors
            </span>
            <XCircle size={18} className="text-error" />
          </div>
          <span className="mt-2 text-3xl font-bold tracking-tight text-error">
            {errorCount}
          </span>
          <span className="mt-1 text-xs text-muted">
            {errorCount === 1 ? "1 job blocked" : `${errorCount} jobs blocked from import`}
          </span>
        </button>
      </div>

      {/* Overall Summary Message Banner */}
      {totalCount === 0 ? (
        <div
          role="alert"
          className="rounded-[var(--radius-card)] border border-border bg-card p-5 text-center shadow-soft"
        >
          <p className="text-sm font-semibold text-text">
            No jobs are ready to import.
          </p>
          <p className="mt-1 text-xs text-muted">
            All rows have been removed. Upload a new or corrected Excel file to proceed.
          </p>
          <div className="mt-4">
            <Button variant="secondary" onClick={onStartOver}>
              Upload Corrected Excel File
            </Button>
          </div>
        </div>
      ) : errorCount > 0 ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-[var(--radius-card)] border border-error/30 bg-error/10 p-4 text-error shadow-soft sm:p-5"
        >
          <XCircle size={20} className="mt-0.5 shrink-0 text-error" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-error">
              Some jobs contain errors and cannot be imported.
            </h3>
            <p className="mt-0.5 text-xs text-error/90">
              Review or remove those rows before continuing, or download the error report to fix the Excel file.
            </p>
          </div>
          {(errorCount > 0 || warningCount > 0) && (
            <button
              type="button"
              onClick={handleDownloadReport}
              disabled={isDownloadingReport}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-error/30 bg-card px-3 py-1.5 text-xs font-semibold text-error hover:bg-error/15 transition-colors"
            >
              <Download size={13} />
              Error Report
            </button>
          )}
        </div>
      ) : warningCount > 0 ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-[var(--radius-card)] border border-warning/30 bg-warning/10 p-4 text-warning-foreground shadow-soft sm:p-5"
        >
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-warning-foreground" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-text">
              Some jobs contain warnings. Review them before importing.
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              Warnings are non-blocking suggestions (e.g. single salary limit or potential duplicates).
            </p>
          </div>
        </div>
      ) : (
        <div
          role="status"
          className="flex items-start gap-3 rounded-[var(--radius-card)] border border-success/30 bg-success/10 p-4 text-success shadow-soft sm:p-5"
        >
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-text">
              All jobs are ready to import.
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              Every job in this upload passed validation successfully without blocking errors.
            </p>
          </div>
        </div>
      )}

      {/* Main Review Table Card */}
      <div className="space-y-4 rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-soft sm:p-6">
        {/* Table Toolbar & Search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: "all", label: "All", count: totalCount },
                { id: "valid", label: "Ready", count: readyCount },
                { id: "warning", label: "Warnings", count: warningCount },
                { id: "error", label: "Errors", count: errorCount },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  activeFilter === tab.id
                    ? "bg-primary text-white shadow-soft"
                    : "bg-surface text-muted hover:bg-surface/80 hover:text-text"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    activeFilter === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-border text-muted"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface py-1.5 pl-9 pr-3 text-xs text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={selectAllEligible}
              className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-text hover:bg-muted/10 transition-colors"
            >
              Select All Ready ({readyCount + warningCount})
            </button>
            <button
              type="button"
              onClick={deselectAll}
              className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-muted hover:text-text transition-colors"
            >
              Deselect All
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {displayedRows.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={expandAllDisplayed}
                  className="text-xs font-medium text-muted hover:text-text transition-colors"
                >
                  Expand All
                </button>
                <span className="text-border">•</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="text-xs font-medium text-muted hover:text-text transition-colors"
                >
                  Collapse All
                </button>
              </>
            )}

            {(errorCount > 0 || warningCount > 0) && (
              <button
                type="button"
                onClick={handleDownloadReport}
                disabled={isDownloadingReport}
                className="inline-flex items-center gap-1 text-xs font-semibold text-error hover:underline ml-2"
              >
                <Download size={13} />
                Download Error Report
              </button>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/75 text-muted">
                <tr>
                  <th className="w-10 px-3 py-2.5 text-center font-medium">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="w-14 px-3 py-2.5 font-semibold text-text">Row</th>
                  <th className="px-3 py-2.5 font-semibold text-text">Job Title</th>
                  <th className="px-3 py-2.5 font-semibold text-text">SAP Module</th>
                  <th className="px-3 py-2.5 font-semibold text-text">Job Type</th>
                  <th className="px-3 py-2.5 font-semibold text-text">Location</th>
                  <th className="px-3 py-2.5 font-semibold text-text">Work Mode</th>
                  <th className="px-3 py-2.5 font-semibold text-text">Experience</th>
                  <th className="px-3 py-2.5 text-center font-semibold text-text">Status</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-text">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-muted">
                      <p className="text-sm font-medium">No rows match your filter</p>
                      <p className="mt-1 text-xs">
                        Try adjusting your search query or selecting a different status tab.
                      </p>
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((row) => {
                    const isExpanded = expandedRows.has(row.rowNumber);
                    const isSelected = selectedRowNumbers.has(row.rowNumber);
                    const isError = row.status === "error";
                    const isRemoving = rowPendingRemoval === row.rowNumber;

                    return (
                      <PreviewRow
                        key={row.rowNumber}
                        row={row}
                        isExpanded={isExpanded}
                        isSelected={isSelected}
                        isError={isError}
                        isRemoving={isRemoving}
                        onToggleSelected={() =>
                          toggleRowSelected(row.rowNumber, row.status)
                        }
                        onToggleExpanded={() => toggleRowExpanded(row.rowNumber)}
                        onRequestRemove={() => setRowPendingRemoval(row.rowNumber)}
                        onCancelRemove={() => setRowPendingRemoval(null)}
                        onConfirmRemove={() => handleRemoveRow(row.rowNumber)}
                        renderStatusBadge={renderStatusBadge}
                      />
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Warning Acknowledgement Section */}
      {requiresWarningAcknowledgement && (
        <div className="rounded-2xl border border-warning/40 bg-warning/10 p-5 shadow-soft">
          <div className="flex items-start gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/20 text-warning-foreground">
              <AlertTriangle size={20} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-text">
                Some selected jobs contain warnings.
              </h3>
              <p className="mt-1 text-xs text-muted">
                <span className="font-semibold text-text">
                  {selectedWarningsCount} selected job{selectedWarningsCount === 1 ? "" : "s"}
                </span>{" "}
                have non-blocking notices (e.g. potential duplicate jobs or single salary values). You can import these jobs if you acknowledge the warnings.
              </p>

              <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-xs font-semibold text-text">
                <input
                  type="checkbox"
                  checked={warningAcknowledged}
                  onChange={(e) => setWarningAcknowledged(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span>I understand these warnings and want to continue.</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Summary & Actions Footer */}
      <div className="flex flex-col-reverse gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        {/* Navigation buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
            className="w-full sm:w-auto"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onStartOver}
            className="w-full sm:w-auto"
          >
            <RotateCcw size={14} />
            Start Over
          </Button>
        </div>

        {/* Import Summary & Continue Action */}
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="text-left sm:text-right">
            {selectedCount > 0 ? (
              <>
                <p className="text-sm font-bold text-text">
                  {selectedCount} job{selectedCount === 1 ? "" : "s"} selected for import
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-muted sm:justify-end">
                  {selectedWarningsCount > 0 && (
                    <span className="text-warning-foreground">
                      {selectedWarningsCount} with warnings
                    </span>
                  )}
                  {errorCount > 0 && (
                    <span className="text-error">
                      • {errorCount} error{errorCount === 1 ? "" : "s"} excluded
                    </span>
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs font-medium text-error">
                Select at least one valid job to continue.
              </p>
            )}
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={() => setIsConfirmDialogOpen(true)}
            disabled={!canProceedToConfirmation}
            className="w-full sm:w-auto min-w-[170px]"
          >
            Continue to Import
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <BulkImportConfirmDialog
        open={isConfirmDialogOpen}
        selectedCount={selectedCount}
        warningCount={selectedWarningsCount}
        errorCount={errorCount}
        loading={isImporting}
        onConfirm={handleConfirmImport}
        onCancel={() => setIsConfirmDialogOpen(false)}
      />
    </div>
  );
}


function PreviewRow({
  row,
  isExpanded,
  isSelected,
  isError,
  isRemoving,
  onToggleSelected,
  onToggleExpanded,
  onRequestRemove,
  onCancelRemove,
  onConfirmRemove,
  renderStatusBadge,
}: {
  row: BulkJobValidationRow;
  isExpanded: boolean;
  isSelected: boolean;
  isError: boolean;
  isRemoving: boolean;
  onToggleSelected: () => void;
  onToggleExpanded: () => void;
  onRequestRemove: () => void;
  onCancelRemove: () => void;
  onConfirmRemove: () => void;
  renderStatusBadge: (status: RowValidationStatus) => React.ReactNode;
}) {
  const { rowNumber, status, data, errors, warnings } = row;
  const hasIssues = errors.length > 0 || warnings.length > 0;

  return (
    <>
      <tr
        className={`transition-colors ${
          isExpanded
            ? "bg-surface"
            : isError
            ? "bg-error/5 hover:bg-error/10"
            : status === "warning"
            ? "hover:bg-warning/5"
            : "hover:bg-surface/50"
        }`}
      >
        {/* Selection Checkbox */}
        <td className="px-3 py-3 text-center">
          {isError ? (
            <span
              title="Error rows cannot be imported"
              className="inline-flex h-4 w-4 items-center justify-center rounded border border-border bg-border/40 text-[10px] font-bold text-muted cursor-not-allowed"
            >
              —
            </span>
          ) : (
            <input
              type="checkbox"
              aria-label={`Select Row ${rowNumber}`}
              checked={isSelected}
              onChange={onToggleSelected}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
          )}
        </td>

        {/* Row Number */}
        <td className="whitespace-nowrap px-3 py-3 font-mono font-semibold text-text">
          Row {rowNumber}
        </td>

        {/* Job Title */}
        <td className="px-3 py-3 font-medium text-text">
          <div className="flex items-center gap-1.5">
            <span className="truncate max-w-[200px]">
              {data.title || (
                <span className="italic text-muted">[Empty Job Title]</span>
              )}
            </span>
            {hasIssues && (
              <span
                className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                  isError
                    ? "bg-error/20 text-error"
                    : "bg-warning/20 text-warning-foreground"
                }`}
              >
                {errors.length + warnings.length}
              </span>
            )}
          </div>
        </td>

        {/* SAP Module */}
        <td className="whitespace-nowrap px-3 py-3">
          <span className="rounded-md bg-surface border border-border px-2 py-0.5 font-medium text-text">
            {data.sapModule || (
              <span className="italic text-error">Missing</span>
            )}
          </span>
        </td>

        {/* Job Type */}
        <td className="whitespace-nowrap px-3 py-3 text-muted">
          {data.jobType || "—"}
        </td>

        {/* Location */}
        <td className="whitespace-nowrap px-3 py-3 text-muted">
          {data.location || <span className="italic text-error">Missing</span>}
        </td>

        {/* Work Mode */}
        <td className="whitespace-nowrap px-3 py-3 text-muted">
          {data.workMode || "—"}
        </td>

        {/* Experience */}
        <td className="whitespace-nowrap px-3 py-3 text-muted">
          {data.minExperience !== undefined && data.maxExperience !== undefined
            ? `${data.minExperience}–${data.maxExperience} yrs`
            : "—"}
        </td>

        {/* Status Badge */}
        <td className="whitespace-nowrap px-3 py-3 text-center">
          {renderStatusBadge(status)}
        </td>

        {/* Actions (View Details, Remove) */}
        <td className="whitespace-nowrap px-3 py-3 text-right">
          {isRemoving ? (
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-[11px] text-error font-semibold">Remove?</span>
              <button
                type="button"
                onClick={onConfirmRemove}
                className="rounded bg-error px-2 py-0.5 text-[11px] font-bold text-white hover:bg-error/90"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={onCancelRemove}
                className="rounded border border-border bg-surface px-1.5 py-0.5 text-[11px] font-medium text-muted hover:text-text"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={onToggleExpanded}
                title={isExpanded ? "Collapse Details" : "View Details"}
                className="rounded-lg border border-border bg-surface p-1 text-muted hover:text-text hover:bg-muted/10 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>

              <button
                type="button"
                onClick={onRequestRemove}
                title="Remove from import"
                className="rounded-lg border border-border bg-surface p-1 text-muted hover:text-error hover:border-error/30 hover:bg-error/10 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </td>
      </tr>

      {/* Expanded Row Detail View */}
      {isExpanded && (
        <tr className="bg-surface/60">
          <td colSpan={10} className="px-4 py-4 sm:px-6">
            <div className="space-y-3.5">
              {/* Errors List */}
              {errors.length > 0 && (
                <div className="rounded-xl border border-error/30 bg-error/10 p-3.5 text-error">
                  <div className="flex items-center gap-2 font-semibold text-xs text-error">
                    <XCircle size={15} aria-hidden="true" />
                    <span>Blocking Validation Errors ({errors.length}) — Cannot be imported</span>
                  </div>
                  <ul className="mt-2 space-y-1.5 text-xs text-error/95">
                    {errors.map((err, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-semibold text-error">
                          ❌ {err.field}:
                        </span>
                        <span>{err.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings List */}
              {warnings.length > 0 && (
                <div className="rounded-xl border border-warning/30 bg-warning/10 p-3.5 text-warning-foreground">
                  <div className="flex items-center gap-2 font-semibold text-xs text-text">
                    <AlertCircle size={15} aria-hidden="true" />
                    <span>Validation Warnings ({warnings.length})</span>
                  </div>
                  <ul className="mt-2 space-y-1.5 text-xs text-muted">
                    {warnings.map((warn, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-semibold text-text">
                          ⚠ {warn.field}:
                        </span>
                        <span>{warn.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Normalized Job Data Breakdown */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Job Specifications
                  </p>
                  <span className="text-[11px] text-muted">
                    Excel Row #{rowNumber}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs sm:grid-cols-4">
                  <div>
                    <span className="text-muted block text-[11px]">Job Title:</span>
                    <span className="font-semibold text-text">
                      {data.title || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">SAP Module:</span>
                    <span className="font-semibold text-text">
                      {data.sapModule || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Job Type:</span>
                    <span className="font-medium text-text">
                      {data.jobType || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Employment Type:</span>
                    <span className="font-medium text-text">
                      {data.employmentType || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Location & Country:</span>
                    <span className="font-medium text-text">
                      {data.location ? `${data.location}, ${data.country}` : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Work Mode:</span>
                    <span className="font-medium text-text">
                      {data.workMode || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Experience:</span>
                    <span className="font-medium text-text">
                      {data.minExperience}–{data.maxExperience} years
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Salary Range:</span>
                    <span className="font-medium text-text">
                      {data.minSalary || data.maxSalary
                        ? `${data.currency} ${data.minSalary?.toLocaleString() ?? 0} – ${data.maxSalary?.toLocaleString() ?? 0}`
                        : "Not specified"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Notice Period:</span>
                    <span className="font-medium text-text">
                      {data.noticePeriod || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Education:</span>
                    <span className="font-medium text-text">
                      {data.education || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Vacancies / Openings:</span>
                    <span className="font-medium text-text">
                      {data.openings || 1}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Application Deadline:</span>
                    <span className="font-medium text-text">
                      {data.deadline || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Contact Email:</span>
                    <span className="font-medium text-text truncate">
                      {data.contactEmail || "—"}
                    </span>
                  </div>
                </div>

                {data.skills && data.skills.length > 0 && (
                  <div className="mt-3.5 border-t border-border/60 pt-3">
                    <span className="text-[11px] font-semibold text-muted">
                      Required Skills ({data.skills.length}):
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {data.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-surface border border-border px-2 py-0.5 text-[11px] text-text"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {data.description && (
                  <div className="mt-3.5 border-t border-border/60 pt-3">
                    <span className="text-[11px] font-semibold text-muted">
                      Job Description Summary:
                    </span>
                    <p className="mt-1 text-xs text-text/90 line-clamp-3">
                      {data.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
