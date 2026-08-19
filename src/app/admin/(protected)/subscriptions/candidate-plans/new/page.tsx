"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CandidatePlanForm, createCandidatePlan, type CandidatePlanFormData } from "@/features/admin-plans";

export default function NewCandidatePlanPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (formData: CandidatePlanFormData) => {
    setIsSubmitting(true);
    const res = await createCandidatePlan(formData);
    setIsSubmitting(false);

    if (res.success && res.data) {
      router.push(`/admin/subscriptions/candidate-plans/${res.data.id}`);
    } else {
      throw new Error(res.error || "Failed to create candidate plan");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-text tracking-tight">
          Create Candidate Plan
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Define a new candidate subscription tier with custom pricing, quota limits, and system entitlements.
        </p>
      </div>

      <CandidatePlanForm
        isCreate={true}
        isSubmitting={isSubmitting}
        onSubmit={handleCreate}
      />
    </div>
  );
}
