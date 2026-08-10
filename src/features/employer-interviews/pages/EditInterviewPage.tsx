"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { ScheduleInterviewForm } from "../components/ScheduleInterviewForm";
import { InterviewDetailsSkeleton } from "../components/InterviewSkeletons";
import { EMPLOYER_INTERVIEW_ROUTES } from "../constants";
import { useInterview } from "../hooks/useInterviews";
import { interviewService } from "../services/interviewService";
import type { UpdateInterviewInput } from "../types/interview.types";

export function EditInterviewPage({ interviewId }: { interviewId: string }) {
  const router = useRouter();
  const { interview, isLoading, isError, error, reload } =
    useInterview(interviewId);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (input: UpdateInterviewInput) => {
    setSaving(true);
    const result = await interviewService.updateInterview(interviewId, input);
    setSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Interview updated successfully.");
    router.push(EMPLOYER_INTERVIEW_ROUTES.details(interviewId));
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
          Edit Interview
        </h1>
        <p className="mt-1 text-sm text-muted">
          Update schedule details. Candidate and job cannot be changed.
        </p>
      </div>

      <ScheduleInterviewForm
        mode="edit"
        loading={saving}
        initialValues={{
          scheduledDate: interview.scheduledDate,
          startTime: interview.startTime,
          endTime: interview.endTime,
          timezone: interview.timezone,
          type: interview.type,
          meetingLink: interview.meetingLink ?? "",
          phoneNumber: interview.phoneNumber ?? "",
          location: interview.location ?? "",
          interviewers: interview.interviewers,
          notes: interview.notes,
          candidateName: interview.candidateName,
          jobTitle: interview.jobTitle,
        }}
        onCancel={() =>
          router.push(EMPLOYER_INTERVIEW_ROUTES.details(interviewId))
        }
        onSubmitEdit={handleSubmit}
      />
    </div>
  );
}
