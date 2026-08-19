"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import {
  AdminEmployerDetails,
  EmployerDetailsView,
  fetchEmployerById,
} from "@/features/admin-users";

type EmployerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function EmployerDetailPage({ params }: EmployerDetailPageProps) {
  const { id } = use(params);
  const [employer, setEmployer] = useState<AdminEmployerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmployer = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchEmployerById(id);
      if (res.error) {
        setError(res.error);
      } else if (!res.data) {
        setError("Employer not found.");
      } else {
        setEmployer(res.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load employer");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEmployer();
  }, [loadEmployer]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-xs text-muted">Loading employer details...</p>
      </div>
    );
  }

  if (error || !employer) {
    return (
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-12 text-center shadow-soft space-y-4 max-w-md mx-auto mt-8">
        <Building2 size={36} className="mx-auto text-rose-500" />
        <div>
          <h2 className="text-base font-bold text-text">Unable to Load Employer</h2>
          <p className="text-xs text-muted mt-1">{error || "Employer company could not be located."}</p>
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            href="/admin/users/employers"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3.5 py-2 text-xs font-medium text-text hover:bg-surface transition"
          >
            <ArrowLeft size={13} />
            <span>Back to Employers</span>
          </Link>
          <button
            type="button"
            onClick={() => loadEmployer()}
            className="rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition shadow-xs"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <EmployerDetailsView employer={employer} onRefresh={loadEmployer} />;
}
