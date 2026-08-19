"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, UserX } from "lucide-react";
import {
  AdminCandidateDetails,
  CandidateDetailsView,
  fetchCandidateById,
} from "@/features/admin-users";

type CandidateDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function CandidateDetailPage({ params }: CandidateDetailPageProps) {
  const { id } = use(params);
  const [candidate, setCandidate] = useState<AdminCandidateDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCandidate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchCandidateById(id);
      if (res.error) {
        setError(res.error);
      } else if (!res.data) {
        setError("Candidate not found.");
      } else {
        setCandidate(res.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load candidate");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCandidate();
  }, [loadCandidate]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-3">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-xs text-muted">Loading candidate details...</p>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-12 text-center shadow-soft space-y-4 max-w-md mx-auto mt-8">
        <UserX size={36} className="mx-auto text-rose-500" />
        <div>
          <h2 className="text-base font-bold text-text">Unable to Load Candidate</h2>
          <p className="text-xs text-muted mt-1">{error || "Candidate could not be located."}</p>
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <Link
            href="/admin/users/candidates"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3.5 py-2 text-xs font-medium text-text hover:bg-surface transition"
          >
            <ArrowLeft size={13} />
            <span>Back to Candidates</span>
          </Link>
          <button
            type="button"
            onClick={() => loadCandidate()}
            className="rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition shadow-xs"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <CandidateDetailsView candidate={candidate} onRefresh={loadCandidate} />;
}
