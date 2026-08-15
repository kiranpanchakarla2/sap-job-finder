"use client";

import { useState } from "react";
import { Bell, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useJobAlerts } from "../context/JobAlertsProvider";
import { JobAlertCard } from "../components/JobAlertCard";
import { JobAlertModal } from "../components/JobAlertModal";
import { DeleteAlertModal } from "../components/DeleteAlertModal";
import { AlertEmptyState, AlertListSkeleton } from "../components/AlertStates";
import type { JobAlert, JobAlertInput } from "../types/alert.types";

export function JobAlertsPage() {
  const {
    alerts,
    activeAlertsCount,
    totalAlertsCount,
    loading,
    createAlert,
    updateAlert,
    togglePauseAlert,
    deleteAlert,
  } = useJobAlerts();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<JobAlert | null>(null);
  const [deletingAlert, setDeletingAlert] = useState<JobAlert | null>(null);

  const handleOpenCreate = () => {
    setEditingAlert(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (alert: JobAlert) => {
    setEditingAlert(alert);
    setModalOpen(true);
  };

  const handleSave = async (input: JobAlertInput): Promise<boolean> => {
    if (editingAlert) {
      return updateAlert(editingAlert.id, input);
    }
    return createAlert(input);
  };

  const handleConfirmDelete = async (id: string) => {
    const success = await deleteAlert(id);
    if (success) {
      setDeletingAlert(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Job Alerts
          </h1>
          <p className="mt-1 text-sm text-muted">
            Get notified when new SAP jobs match your preferences.
            {totalAlertsCount > 0
              ? ` · ${activeAlertsCount} active (${totalAlertsCount} total)`
              : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="theme-btn-primary inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-button)] px-4 text-sm font-semibold text-button-fg shadow-[var(--shadow-button)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <Plus size={16} aria-hidden="true" />
          Create Job Alert
        </button>
      </header>

      {loading ? (
        <AlertListSkeleton count={3} />
      ) : alerts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {alerts.map((alert) => (
            <JobAlertCard
              key={alert.id}
              alert={alert}
              onEdit={handleOpenEdit}
              onTogglePause={(id) => void togglePauseAlert(id)}
              onDelete={(a) => setDeletingAlert(a)}
            />
          ))}
        </div>
      ) : (
        <AlertEmptyState onCreateAlert={handleOpenCreate} />
      )}

      {/* Pro-tip card */}
      {alerts.length > 0 && (
        <div className="rounded-[var(--radius-card)] border border-border bg-surface/50 p-4 text-xs text-muted sm:p-5">
          <div className="flex items-center gap-2 font-semibold text-text">
            <Sparkles size={14} className="text-primary" aria-hidden="true" />
            <span>Pro Tip for SAP Candidates</span>
          </div>
          <p className="mt-1 leading-relaxed">
            Create distinct alerts for your top SAP modules (e.g. one for Fiori/UI5 and another for BTP / Integration Suite) with specific work mode preferences (Remote vs Hybrid) to catch high-match roles first.
          </p>
        </div>
      )}

      <JobAlertModal
        open={modalOpen}
        initialAlert={editingAlert}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      <DeleteAlertModal
        open={Boolean(deletingAlert)}
        alert={deletingAlert}
        onClose={() => setDeletingAlert(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
