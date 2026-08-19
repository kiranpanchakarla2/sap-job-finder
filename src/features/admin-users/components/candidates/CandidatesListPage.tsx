"use client";

import { useCallback, useEffect, useState } from "react";
import { UserRound, Users, RefreshCw } from "lucide-react";
import type {
  AdminCandidateListItem,
  CandidateFilterState,
  CandidatePaginationState,
  CandidateSortField,
  CandidateSortOrder,
} from "../../types/candidate.types";
import { CandidateSearchFilters } from "./CandidateSearchFilters";
import { CandidateListTable } from "./CandidateListTable";
import { CandidatePagination } from "./CandidatePagination";
import { CandidateSuspendModal } from "./CandidateSuspendModal";
import { CandidateReactivateModal } from "./CandidateReactivateModal";
import {
  fetchCandidates,
  suspendCandidate,
  reactivateCandidate,
} from "../../services/adminCandidateService";

const DEFAULT_FILTERS: CandidateFilterState = {
  search: "",
  status: "all",
  subscription: "all",
  discoverability: "all",
  sapModule: "all",
  registrationDate: "all",
};

export function CandidatesListPage() {
  const [filters, setFilters] = useState<CandidateFilterState>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<CandidateSortField>("created_at");
  const [sortOrder, setSortOrder] = useState<CandidateSortOrder>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [candidates, setCandidates] = useState<AdminCandidateListItem[]>([]);
  const [pagination, setPagination] = useState<CandidatePaginationState>({
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [selectedCandidate, setSelectedCandidate] = useState<AdminCandidateListItem | null>(null);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [reactivateModalOpen, setReactivateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchCandidates({
        filters,
        sortBy,
        sortOrder,
        page,
        pageSize,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setCandidates(res.data);
        setPagination(res.pagination);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load candidates");
    } finally {
      setIsLoading(false);
    }
  }, [filters, sortBy, sortOrder, page, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = useCallback((next: Partial<CandidateFilterState>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  const handleSort = useCallback(
    (field: CandidateSortField) => {
      if (sortBy === field) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(field);
        setSortOrder("desc");
      }
      setPage(1);
    },
    [sortBy],
  );

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const handleOpenSuspend = useCallback((cand: AdminCandidateListItem) => {
    setSelectedCandidate(cand);
    setSuspendModalOpen(true);
  }, []);

  const handleOpenReactivate = useCallback((cand: AdminCandidateListItem) => {
    setSelectedCandidate(cand);
    setReactivateModalOpen(true);
  }, []);

  const handleSuspendConfirm = async () => {
    if (!selectedCandidate) return;
    const res = await suspendCandidate(selectedCandidate.id);
    if (res.success) {
      setToastMessage({ text: "Candidate account suspended successfully.", type: "success" });
      await loadData();
    } else {
      setToastMessage({ text: res.error || "Failed to suspend candidate.", type: "error" });
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleReactivateConfirm = async () => {
    if (!selectedCandidate) return;
    const res = await reactivateCandidate(selectedCandidate.id);
    if (res.success) {
      setToastMessage({ text: "Candidate account reactivated successfully.", type: "success" });
      await loadData();
    } else {
      setToastMessage({ text: res.error || "Failed to reactivate candidate.", type: "error" });
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed top-5 right-5 z-50 rounded-md p-3.5 text-xs font-medium shadow-lg border animate-in slide-in-from-top duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
          }`}
        >
          {toastMessage.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <UserRound size={22} className="text-primary" />
            <h1 className="text-xl font-bold text-text">Candidate Management</h1>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Oversee registered candidate profiles, discoverability settings, subscriptions, and account lifecycle.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData()}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 self-start rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-text hover:bg-surface disabled:opacity-50 transition shadow-xs"
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search & Filters */}
      <CandidateSearchFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        isLoading={isLoading}
      />

      {/* Table Container */}
      <div className="space-y-0">
        <CandidateListTable
          candidates={candidates}
          isLoading={isLoading}
          error={error}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onSuspend={handleOpenSuspend}
          onReactivate={handleOpenReactivate}
        />

        <CandidatePagination
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
        />
      </div>

      {/* Suspend Confirmation Modal */}
      {selectedCandidate && (
        <CandidateSuspendModal
          isOpen={suspendModalOpen}
          candidateName={selectedCandidate.fullName}
          onClose={() => setSuspendModalOpen(false)}
          onConfirm={handleSuspendConfirm}
        />
      )}

      {/* Reactivate Confirmation Modal */}
      {selectedCandidate && (
        <CandidateReactivateModal
          isOpen={reactivateModalOpen}
          candidateName={selectedCandidate.fullName}
          onClose={() => setReactivateModalOpen(false)}
          onConfirm={handleReactivateConfirm}
        />
      )}
    </div>
  );
}
