"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Filter,
  Plus,
  Power,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import type {
  AdminEmployerPlan,
  PlanFilterState,
  PlanSortField,
  PlanSortOrder,
} from "../../types/plan.types";
import {
  fetchEmployerPlans,
  toggleEmployerPlanStatus,
} from "../../services/adminEmployerPlanService";
import { EmployerPlansTable } from "./EmployerPlansTable";
import { EmployerPlanDeactivateModal } from "./EmployerPlanDeactivateModal";
import { EmployerPlanActivateModal } from "./EmployerPlanActivateModal";

export function EmployerPlansListPage() {
  const [plans, setPlans] = useState<AdminEmployerPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<PlanFilterState>({
    search: "",
    status: "all",
  });
  const [sortBy, setSortBy] = useState<PlanSortField>("sort_order");
  const [sortOrder, setSortOrder] = useState<PlanSortOrder>("asc");

  // Modals state
  const [selectedPlan, setSelectedPlan] = useState<AdminEmployerPlan | null>(null);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchEmployerPlans({
        filters,
        sortBy,
        sortOrder,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setPlans(res.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load employer plans");
    } finally {
      setIsLoading(false);
    }
  }, [filters, sortBy, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Deactivate Confirm
  const handleConfirmDeactivate = async () => {
    if (!selectedPlan) return;
    setIsSubmittingAction(true);
    try {
      const res = await toggleEmployerPlanStatus(selectedPlan.id, false);
      if (res.success) {
        showToast(`Employer plan "${selectedPlan.name}" deactivated successfully.`);
        setDeactivateModalOpen(false);
        setSelectedPlan(null);
        await loadData();
      } else {
        showToast(res.error || "Failed to deactivate plan", "error");
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error deactivating plan", "error");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Handle Activate Confirm
  const handleConfirmActivate = async () => {
    if (!selectedPlan) return;
    setIsSubmittingAction(true);
    try {
      const res = await toggleEmployerPlanStatus(selectedPlan.id, true);
      if (res.success) {
        showToast(`Employer plan "${selectedPlan.name}" activated successfully.`);
        setActivateModalOpen(false);
        setSelectedPlan(null);
        await loadData();
      } else {
        showToast(res.error || "Failed to activate plan", "error");
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error activating plan", "error");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = plans.length;
    const active = plans.filter((p) => p.isActive).length;
    const inactive = total - active;
    const totalSubscriptions = plans.reduce((acc, p) => acc + (p.activeSubscriptionsCount || 0), 0);
    return { total, active, inactive, totalSubscriptions };
  }, [plans]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-elevation-3 flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Power className="h-4 w-4" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text tracking-tight flex items-center gap-2.5">
            <Building2 className="h-6 w-6 text-primary" />
            Employer Subscription Plans
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Configure enterprise recruitment tiers, job limits, talent search caps, and pricing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadData()}
            title="Refresh list"
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-border text-text-muted hover:text-text hover:bg-surface transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/admin/subscriptions/employer-plans/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-soft transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Employer Plan
          </Link>
        </div>
      </div>

      {/* Quick Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-1 shadow-soft">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Total Plans
          </span>
          <div className="text-xl font-extrabold text-text">{stats.total}</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-1 shadow-soft">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Active Plans
          </span>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {stats.active}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-1 shadow-soft">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Inactive Plans
          </span>
          <div className="text-xl font-extrabold text-text-muted">{stats.inactive}</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-1 shadow-soft">
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
            Active Subscriptions
          </span>
          <div className="text-xl font-extrabold text-primary flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {stats.totalSubscriptions}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-border bg-surface p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-soft">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Search employer plans..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-hover/50 border border-border text-xs text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-surface-hover/50 p-1 rounded-xl border border-border text-xs font-semibold text-text-secondary">
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, status: "all" }))}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filters.status === "all"
                  ? "bg-surface text-text font-bold shadow-soft"
                  : "hover:text-text"
              }`}
            >
              All ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, status: "active" }))}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filters.status === "active"
                  ? "bg-surface text-emerald-600 dark:text-emerald-400 font-bold shadow-soft"
                  : "hover:text-text"
              }`}
            >
              Active ({stats.active})
            </button>
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, status: "inactive" }))}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filters.status === "inactive"
                  ? "bg-surface text-text font-bold shadow-soft"
                  : "hover:text-text"
              }`}
            >
              Inactive ({stats.inactive})
            </button>
          </div>
        </div>
      </div>

      {/* Plans Table */}
      <EmployerPlansTable
        plans={plans}
        isLoading={isLoading}
        error={error}
        onRetry={loadData}
        onDeactivate={(plan) => {
          setSelectedPlan(plan);
          setDeactivateModalOpen(true);
        }}
        onActivate={(plan) => {
          setSelectedPlan(plan);
          setActivateModalOpen(true);
        }}
      />

      {/* Modals */}
      <EmployerPlanDeactivateModal
        plan={selectedPlan}
        isOpen={deactivateModalOpen}
        isSubmitting={isSubmittingAction}
        onClose={() => {
          setDeactivateModalOpen(false);
          setSelectedPlan(null);
        }}
        onConfirm={handleConfirmDeactivate}
      />

      <EmployerPlanActivateModal
        plan={selectedPlan}
        isOpen={activateModalOpen}
        isSubmitting={isSubmittingAction}
        onClose={() => {
          setActivateModalOpen(false);
          setSelectedPlan(null);
        }}
        onConfirm={handleConfirmActivate}
      />
    </div>
  );
}
