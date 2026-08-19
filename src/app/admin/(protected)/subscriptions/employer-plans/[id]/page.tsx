"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Power, CheckCircle2 } from "lucide-react";
import {
  EmployerPlanDetailsView,
  EmployerPlanDeactivateModal,
  EmployerPlanActivateModal,
  getEmployerPlanById,
  toggleEmployerPlanStatus,
  type AdminEmployerPlan,
} from "@/features/admin-plans";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function EmployerPlanDetailsPage({ params }: PageProps) {
  const { id } = use(params);

  const [plan, setPlan] = useState<AdminEmployerPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadPlan = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getEmployerPlanById(id);
      if (res.error) {
        setError(res.error);
      } else {
        setPlan(res.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load employer plan");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const handleConfirmDeactivate = async () => {
    if (!plan) return;
    setIsSubmittingAction(true);
    try {
      const res = await toggleEmployerPlanStatus(plan.id, false);
      if (res.success) {
        showToast(`Employer plan "${plan.name}" deactivated successfully.`);
        setDeactivateModalOpen(false);
        await loadPlan();
      } else {
        showToast(res.error || "Failed to deactivate plan", "error");
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error deactivating plan", "error");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleConfirmActivate = async () => {
    if (!plan) return;
    setIsSubmittingAction(true);
    try {
      const res = await toggleEmployerPlanStatus(plan.id, true);
      if (res.success) {
        showToast(`Employer plan "${plan.name}" activated successfully.`);
        setActivateModalOpen(false);
        await loadPlan();
      } else {
        showToast(res.error || "Failed to activate plan", "error");
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error activating plan", "error");
    } finally {
      setIsSubmittingAction(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-text-muted font-medium">Loading employer plan details...</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto py-12 text-center">
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-semibold">
          {error || "Employer plan not found."}
        </div>
        <Link
          href="/admin/subscriptions/employer-plans"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-xs font-bold text-text hover:bg-surface-hover transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Employer Plans
        </Link>
      </div>
    );
  }

  return (
    <>
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

      <EmployerPlanDetailsView
        plan={plan}
        onDeactivate={() => setDeactivateModalOpen(true)}
        onActivate={() => setActivateModalOpen(true)}
      />

      <EmployerPlanDeactivateModal
        plan={plan}
        isOpen={deactivateModalOpen}
        isSubmitting={isSubmittingAction}
        onClose={() => setDeactivateModalOpen(false)}
        onConfirm={handleConfirmDeactivate}
      />

      <EmployerPlanActivateModal
        plan={plan}
        isOpen={activateModalOpen}
        isSubmitting={isSubmittingAction}
        onClose={() => setActivateModalOpen(false)}
        onConfirm={handleConfirmActivate}
      />
    </>
  );
}
