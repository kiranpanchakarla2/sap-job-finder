"use client";

import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Filter,
  Search,
  XCircle,
} from "lucide-react";
import type {
  BulkJobValidationRow,
  RowValidationStatus,
} from "../types/bulkUpload.types";

interface BulkJobValidationTableProps {
  rows: BulkJobValidationRow[];
  selectedFilter: "all" | "valid" | "warning" | "error";
  onFilterChange: (filter: "all" | "valid" | "warning" | "error") => void;
}

export function BulkJobValidationTable({
  rows,
  selectedFilter,
  onFilterChange,
}: BulkJobValidationTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

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

  const expandAllIssues = () => {
    const issuesRowNumbers = rows
      .filter((r) => r.status === "error" || r.status === "warning")
      .map((r) => r.rowNumber);
    setExpandedRows(new Set(issuesRowNumbers));
  };

  const collapseAll = () => {
    setExpandedRows(new Set());
  };

  // Filter rows based on status and search query
  const filteredRows = rows.filter((row) => {
    if (selectedFilter !== "all" && row.status !== selectedFilter) {
      return false;
    }

    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();
    const titleMatch = (row.data.title || "").toLowerCase().includes(query);
    const moduleMatch = (row.data.sapModule || "").toLowerCase().includes(query);
    const locMatch = (row.data.location || "").toLowerCase().includes(query);
    const rowNumMatch = String(row.rowNumber).includes(query);

    return titleMatch || moduleMatch || locMatch || rowNumMatch;
  });

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

  const totalIssueRows = rows.filter((r) => r.status !== "valid").length;

  return (
    <div className="space-y-4 rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-soft sm:p-6">
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-text">
            Row Validation Details
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Click any row to inspect fields and review specific validation notices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {totalIssueRows > 0 && (
            <>
              <button
                type="button"
                onClick={expandAllIssues}
                className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text hover:bg-muted/10 transition-colors"
              >
                Expand Issues ({totalIssueRows})
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-muted hover:text-text transition-colors"
              >
                Collapse All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "all", label: "All", count: rows.length },
              {
                id: "valid",
                label: "Ready",
                count: rows.filter((r) => r.status === "valid").length,
              },
              {
                id: "warning",
                label: "Warnings",
                count: rows.filter((r) => r.status === "warning").length,
              },
              {
                id: "error",
                label: "Errors",
                count: rows.filter((r) => r.status === "error").length,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onFilterChange(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                selectedFilter === tab.id
                  ? "bg-primary text-white shadow-soft"
                  : "bg-surface text-muted hover:bg-surface/80 hover:text-text"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  selectedFilter === tab.id
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
            placeholder="Search by title, module, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface py-1.5 pl-9 pr-3 text-xs text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-surface/75 text-muted">
              <tr>
                <th className="w-10 px-3 py-2.5 text-center font-medium"></th>
                <th className="w-16 px-3 py-2.5 font-semibold text-text">Row</th>
                <th className="px-3 py-2.5 font-semibold text-text">Job Title</th>
                <th className="px-3 py-2.5 font-semibold text-text">SAP Module</th>
                <th className="px-3 py-2.5 font-semibold text-text">Location</th>
                <th className="px-3 py-2.5 font-semibold text-text">Experience</th>
                <th className="px-3 py-2.5 text-center font-semibold text-text">
                  Openings
                </th>
                <th className="px-3 py-2.5 text-right font-semibold text-text">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    <p className="text-sm font-medium">No rows match your filter</p>
                    <p className="mt-1 text-xs">
                      Try adjusting the search query or selecting a different status filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const isExpanded = expandedRows.has(row.rowNumber);
                  const hasIssues =
                    row.errors.length > 0 || row.warnings.length > 0;

                  return (
                    <RowItem
                      key={row.rowNumber}
                      row={row}
                      isExpanded={isExpanded}
                      hasIssues={hasIssues}
                      onToggle={() => toggleRowExpanded(row.rowNumber)}
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
  );
}

function RowItem({
  row,
  isExpanded,
  hasIssues,
  onToggle,
  renderStatusBadge,
}: {
  row: BulkJobValidationRow;
  isExpanded: boolean;
  hasIssues: boolean;
  onToggle: () => void;
  renderStatusBadge: (status: RowValidationStatus) => React.ReactNode;
}) {
  const { rowNumber, status, data, errors, warnings } = row;

  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer transition-colors ${
          isExpanded
            ? "bg-surface"
            : status === "error"
            ? "hover:bg-error/5"
            : status === "warning"
            ? "hover:bg-warning/5"
            : "hover:bg-surface/50"
        }`}
      >
        <td className="px-3 py-3 text-center text-muted">
          {isExpanded ? (
            <ChevronDown size={15} aria-hidden="true" />
          ) : (
            <ChevronRight size={15} aria-hidden="true" />
          )}
        </td>
        <td className="whitespace-nowrap px-3 py-3 font-mono font-semibold text-text">
          Row {rowNumber}
        </td>
        <td className="px-3 py-3 font-medium text-text">
          <div className="flex items-center gap-1.5">
            <span className="truncate max-w-[220px]">
              {data.title || (
                <span className="italic text-muted">[Empty Job Title]</span>
              )}
            </span>
            {hasIssues && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-border px-1 text-[10px] font-semibold text-muted">
                {errors.length + warnings.length}
              </span>
            )}
          </div>
        </td>
        <td className="whitespace-nowrap px-3 py-3">
          <span className="rounded-md bg-surface border border-border px-2 py-0.5 font-medium text-text">
            {data.sapModule || (
              <span className="italic text-error">Missing</span>
            )}
          </span>
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-muted">
          {data.location || <span className="italic text-error">Missing</span>}
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-muted">
          {data.minExperience !== undefined && data.maxExperience !== undefined
            ? `${data.minExperience}–${data.maxExperience} yrs`
            : "—"}
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-center text-muted">
          {data.openings || 1}
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-right">
          {renderStatusBadge(status)}
        </td>
      </tr>

      {/* Expanded Row Detail View */}
      {isExpanded && (
        <tr className="bg-surface/60">
          <td colSpan={8} className="px-4 py-4 sm:px-6">
            <div className="space-y-3.5">
              {/* Errors List */}
              {errors.length > 0 && (
                <div className="rounded-xl border border-error/30 bg-error/10 p-3.5 text-error">
                  <div className="flex items-center gap-2 font-semibold text-xs text-error">
                    <XCircle size={15} aria-hidden="true" />
                    <span>Blocking Validation Errors ({errors.length})</span>
                  </div>
                  <ul className="mt-2 space-y-1.5 text-xs text-error/95">
                    {errors.map((err, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-semibold text-error">
                          • {err.field}:
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
                          • {warn.field}:
                        </span>
                        <span>{warn.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Normalized Data Preview Grid */}
              <div className="rounded-xl border border-border bg-card p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Normalized Field Preview
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
                  <div>
                    <span className="text-muted">Job Type: </span>
                    <span className="font-medium text-text">
                      {data.jobType || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Employment: </span>
                    <span className="font-medium text-text">
                      {data.employmentType || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Work Mode: </span>
                    <span className="font-medium text-text">
                      {data.workMode || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Country: </span>
                    <span className="font-medium text-text">
                      {data.country || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Salary: </span>
                    <span className="font-medium text-text">
                      {data.minSalary || data.maxSalary
                        ? `${data.currency} ${data.minSalary ?? 0} – ${data.maxSalary ?? 0}`
                        : "Not specified"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Notice Period: </span>
                    <span className="font-medium text-text">
                      {data.noticePeriod || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Deadline: </span>
                    <span className="font-medium text-text">
                      {data.deadline || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Email: </span>
                    <span className="font-medium text-text truncate">
                      {data.contactEmail || "—"}
                    </span>
                  </div>
                </div>

                {data.skills && data.skills.length > 0 && (
                  <div className="mt-3 border-t border-border/60 pt-2.5">
                    <span className="text-[11px] font-semibold text-muted">
                      Parsed Skills ({data.skills.length}):
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
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
