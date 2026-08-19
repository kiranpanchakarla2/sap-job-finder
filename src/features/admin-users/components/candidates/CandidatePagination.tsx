"use client";

import { memo } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import type { CandidatePaginationState } from "../../types/candidate.types";

type CandidatePaginationProps = {
  pagination: CandidatePaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isLoading?: boolean;
};

export const CandidatePagination = memo(function CandidatePagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
}: CandidatePaginationProps) {
  const { page, pageSize, totalItems, totalPages } = pagination;

  if (totalItems === 0) return null;

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-surface/30 px-5 py-3.5 text-xs text-muted">
      <div className="flex items-center gap-4">
        <span>
          Showing <span className="font-semibold text-text">{startItem}</span>–
          <span className="font-semibold text-text">{endItem}</span> of{" "}
          <span className="font-semibold text-text">{totalItems}</span> candidates
        </span>

        <div className="flex items-center gap-1.5">
          <label htmlFor="candidate-page-size" className="text-muted">
            Per page:
          </label>
          <select
            id="candidate-page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-7 rounded border border-border bg-background px-1.5 text-xs text-text focus:border-primary focus:outline-none"
            disabled={isLoading}
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={page <= 1 || isLoading}
          className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-background text-text hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="First page"
        >
          <ChevronsLeft size={14} />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
          className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-background text-text hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        <span className="px-2 font-medium text-text">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
          className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-background text-text hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages || isLoading}
          className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-background text-text hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="Last page"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
});
