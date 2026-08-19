"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  EmployerPlanForm,
  getEmployerPlanById,
  updateEmployerPlan,
  type AdminEmployerPlan,
  type EmployerPlanFormData,
} from "@/features/admin-plans";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function EditEmployerPlanPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [plan, setPlan] = useState<AdminEmployerPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleUpdate = async (formData: EmployerPlanFormData) => {
    setIsSubmitting(true);
    const res = await updateEmployerPlan(id, formData);
    setIsSubmitting(false);

    if (res.success) {
      router.push(`/admin/subscriptions/employer-plans/${id}`);
    } else {
      throw new Error(res.error || "Failed to update employer plan");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-text-muted font-medium">Loading employer plan for editing...</p>
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
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-text tracking-tight">
          Edit Employer Plan
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Modify pricing, recruitment limits, and system entitlements for <span className="font-bold text-text">{plan.name}</span>.
        </p>
      </div>

      <EmployerPlanForm
        initialPlan={plan}
        isCreate={false}
        isSubmitting={isSubmitting}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
