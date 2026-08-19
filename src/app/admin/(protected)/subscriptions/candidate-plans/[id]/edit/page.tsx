"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  CandidatePlanForm,
  getCandidatePlanById,
  updateCandidatePlan,
  type AdminCandidatePlan,
  type CandidatePlanFormData,
} from "@/features/admin-plans";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function EditCandidatePlanPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [plan, setPlan] = useState<AdminCandidatePlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlan = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getCandidatePlanById(id);
      if (res.error) {
        setError(res.error);
      } else {
        setPlan(res.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load candidate plan");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const handleUpdate = async (formData: CandidatePlanFormData) => {
    setIsSubmitting(true);
    const res = await updateCandidatePlan(id, formData);
    setIsSubmitting(false);

    if (res.success) {
      router.push(`/admin/subscriptions/candidate-plans/${id}`);
    } else {
      throw new Error(res.error || "Failed to update candidate plan");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-text-muted font-medium">Loading candidate plan for editing...</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto py-12 text-center">
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-semibold">
          {error || "Candidate plan not found."}
        </div>
        <Link
          href="/admin/subscriptions/candidate-plans"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-xs font-bold text-text hover:bg-surface-hover transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Candidate Plans
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-text tracking-tight">
          Edit Candidate Plan
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Modify pricing, quota limits, and system entitlements for <span className="font-bold text-text">{plan.name}</span>.
        </p>
      </div>

      <CandidatePlanForm
        initialPlan={plan}
        isCreate={false}
        isSubmitting={isSubmitting}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
