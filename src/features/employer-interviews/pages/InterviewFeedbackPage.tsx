"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { InterviewDetailsSkeleton } from "../components/InterviewSkeletons";
import { InterviewFeedback } from "../components/InterviewFeedback";
import { EMPLOYER_INTERVIEW_ROUTES } from "../constants";
import { useInterview } from "../hooks/useInterviews";
import { interviewService } from "../services/interviewService";
import type { SaveFeedbackInput } from "../types/interview.types";

export function InterviewFeedbackPage({ interviewId }: { interviewId: string }) {
  const router = useRouter();
  const { interview, isLoading, isError, error, reload } =
    useInterview(interviewId);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (input: SaveFeedbackInput) => {
    setSaving(true);
    const result = await interviewService.saveFeedback(interviewId, input);
    setSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Interview feedback saved.");
    await reload();
  };

  const updateApplication = async (status: "hired" | "rejected") => {
    if (!interview) return;
    const result = await interviewService.updateLinkedApplicationStatus(
      interview.applicationId,
      status,
    );
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(
      status === "hired"
        ? "Candidate marked as Hired."
        : "Candidate rejected.",
    );
  };

  if (isLoading) {
    return <InterviewDetailsSkeleton />;
  }

  if (isError || !interview) {
    return (
      <ErrorState
        title="Unable to load interview details."
        description={error ?? undefined}
        onRetry={() => void reload()}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={EMPLOYER_INTERVIEW_ROUTES.details(interviewId)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-primary"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to Interview
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Interview Feedback
        </h1>
        <p className="mt-1 text-sm text-muted">
          {interview.candidateName} · {interview.jobTitle}
        </p>
      </div>

      <InterviewFeedback
        interview={interview}
        loading={saving}
        onCancel={() =>
          router.push(EMPLOYER_INTERVIEW_ROUTES.details(interviewId))
        }
        onSubmit={handleSubmit}
        onHire={() => void updateApplication("hired")}
        onReject={() => void updateApplication("rejected")}
      />
    </div>
  );
}
