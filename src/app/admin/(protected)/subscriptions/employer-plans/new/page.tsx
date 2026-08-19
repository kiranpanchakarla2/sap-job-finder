"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  EmployerPlanForm,
  createEmployerPlan,
  type EmployerPlanFormData,
} from "@/features/admin-plans";

export default function NewEmployerPlanPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (formData: EmployerPlanFormData) => {
    setIsSubmitting(true);
    const res = await createEmployerPlan(formData);
    setIsSubmitting(false);

    if (res.success && res.data) {
      router.push(`/admin/subscriptions/employer-plans/${res.data.id}`);
    } else {
      throw new Error(res.error || "Failed to create employer plan");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-text tracking-tight">
          Create Employer Plan
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Define a new employer recruitment plan with custom job limits, candidate search view quotas, and team seats.
        </p>
      </div>

      <EmployerPlanForm
        isCreate={true}
        isSubmitting={isSubmitting}
        onSubmit={handleCreate}
      />
    </div>
  );
}
