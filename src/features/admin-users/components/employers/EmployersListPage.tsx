"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, RefreshCw } from "lucide-react";
import type {
  AdminEmployerListItem,
  EmployerFilterState,
  EmployerPaginationState,
  EmployerSortField,
  EmployerSortOrder,
} from "../../types/employer.types";
import { EmployerSearchFilters } from "./EmployerSearchFilters";
import { EmployerListTable } from "./EmployerListTable";
import { EmployerPagination } from "./EmployerPagination";
import { EmployerSuspendModal } from "./EmployerSuspendModal";
import { EmployerReactivateModal } from "./EmployerReactivateModal";
import { EmployerVerifyModal } from "./EmployerVerifyModal";
import {
  fetchEmployers,
  suspendEmployer,
  reactivateEmployer,
  setEmployerVerification,
} from "../../services/adminEmployerService";

const DEFAULT_FILTERS: EmployerFilterState = {
  search: "",
  status: "all",
  subscription: "all",
  verification: "all",
  registrationDate: "all",
};

export function EmployersListPage() {
  const [filters, setFilters] = useState<EmployerFilterState>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<EmployerSortField>("created_at");
  const [sortOrder, setSortOrder] = useState<EmployerSortOrder>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [employers, setEmployers] = useState<AdminEmployerListItem[]>([]);
  const [pagination, setPagination] = useState<EmployerPaginationState>({
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [selectedEmployer, setSelectedEmployer] = useState<AdminEmployerListItem | null>(null);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [reactivateModalOpen, setReactivateModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [targetVerification, setTargetVerification] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchEmployers({
        filters,
        sortBy,
        sortOrder,
        page,
        pageSize,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setEmployers(res.data);
        setPagination(res.pagination);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load employers");
    } finally {
      setIsLoading(false);
    }
  }, [filters, sortBy, sortOrder, page, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = useCallback((next: Partial<EmployerFilterState>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  const handleSort = useCallback(
    (field: EmployerSortField) => {
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

  const handleOpenSuspend = useCallback((emp: AdminEmployerListItem) => {
    setSelectedEmployer(emp);
    setSuspendModalOpen(true);
  }, []);

  const handleOpenReactivate = useCallback((emp: AdminEmployerListItem) => {
    setSelectedEmployer(emp);
    setReactivateModalOpen(true);
  }, []);

  const handleOpenVerify = useCallback((emp: AdminEmployerListItem, target: boolean) => {
    setSelectedEmployer(emp);
    setTargetVerification(target);
    setVerifyModalOpen(true);
  }, []);

  const handleSuspendConfirm = async () => {
    if (!selectedEmployer) return;
    const res = await suspendEmployer(selectedEmployer.id);
    if (res.success) {
      setToastMessage({ text: "Employer account suspended successfully.", type: "success" });
      await loadData();
    } else {
      setToastMessage({ text: res.error || "Failed to suspend employer.", type: "error" });
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleReactivateConfirm = async () => {
    if (!selectedEmployer) return;
    const res = await reactivateEmployer(selectedEmployer.id);
    if (res.success) {
      setToastMessage({ text: "Employer account reactivated successfully.", type: "success" });
      await loadData();
    } else {
      setToastMessage({ text: res.error || "Failed to reactivate employer.", type: "error" });
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleVerifyConfirm = async () => {
    if (!selectedEmployer) return;
    const res = await setEmployerVerification(selectedEmployer.id, targetVerification);
    if (res.success) {
      setToastMessage({
        text: targetVerification
          ? "Employer verified successfully."
          : "Employer verification removed.",
        type: "success",
      });
      await loadData();
    } else {
      setToastMessage({ text: res.error || "Failed to update verification.", type: "error" });
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
            <Building2 size={22} className="text-primary" />
            <h1 className="text-xl font-bold text-text">Employer Management</h1>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Manage registered company profiles, team hierarchies, employer verification, and active hiring operations.
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
      <EmployerSearchFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        isLoading={isLoading}
      />

      {/* Table Container */}
      <div className="space-y-0">
        <EmployerListTable
          employers={employers}
          isLoading={isLoading}
          error={error}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onSuspend={handleOpenSuspend}
          onReactivate={handleOpenReactivate}
          onToggleVerify={handleOpenVerify}
        />

        <EmployerPagination
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
        />
      </div>

      {/* Suspend Confirmation Modal */}
      {selectedEmployer && (
        <EmployerSuspendModal
          isOpen={suspendModalOpen}
          companyName={selectedEmployer.companyName}
          onClose={() => setSuspendModalOpen(false)}
          onConfirm={handleSuspendConfirm}
        />
      )}

      {/* Reactivate Confirmation Modal */}
      {selectedEmployer && (
        <EmployerReactivateModal
          isOpen={reactivateModalOpen}
          companyName={selectedEmployer.companyName}
          onClose={() => setReactivateModalOpen(false)}
          onConfirm={handleReactivateConfirm}
        />
      )}

      {/* Verification Modal */}
      {selectedEmployer && (
        <EmployerVerifyModal
          isOpen={verifyModalOpen}
          companyName={selectedEmployer.companyName}
          targetVerification={targetVerification}
          onClose={() => setVerifyModalOpen(false)}
          onConfirm={handleVerifyConfirm}
        />
      )}
    </div>
  );
}
