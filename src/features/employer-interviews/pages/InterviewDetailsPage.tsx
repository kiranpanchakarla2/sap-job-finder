"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { messageService } from "@/features/employer-messages";
import { EMPLOYER_MESSAGE_ROUTES } from "@/features/employer-messages/constants";
import {
  CancelInterviewDialog,
  CompleteInterviewDialog,
  NoShowInterviewDialog,
} from "../components/CancelInterviewDialog";
import { InterviewDetails } from "../components/InterviewDetails";
import { InterviewDetailsSkeleton } from "../components/InterviewSkeletons";
import { EMPLOYER_INTERVIEW_ROUTES } from "../constants";
import { useInterview } from "../hooks/useInterviews";
import { interviewService } from "../services/interviewService";

type DialogKind = "cancel" | "complete" | "no_show" | null;

export function InterviewDetailsPage({ interviewId }: { interviewId: string }) {
  const router = useRouter();
  const { interview, isLoading, isError, error, reload } =
    useInterview(interviewId);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [loading, setLoading] = useState(false);

  const closeDialog = () => {
    if (!loading) setDialog(null);
  };

  const runAction = async (
    action: () => Promise<{ success: boolean; error?: string }>,
    successMessage: string,
    options?: { goToFeedback?: boolean },
  ) => {
    setLoading(true);
    const result = await action();
    setLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Something went wrong.");
      return;
    }
    toast.success(successMessage);
    setDialog(null);
    if (options?.goToFeedback) {
      router.push(EMPLOYER_INTERVIEW_ROUTES.feedback(interviewId));
      return;
    }
    await reload();
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
    <div className="mx-auto max-w-6xl space-y-4">
      <Link
        href={EMPLOYER_INTERVIEW_ROUTES.list}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-primary"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Back to Interviews
      </Link>

      <InterviewDetails
        interview={interview}
        onCancel={() => setDialog("cancel")}
        onComplete={() => setDialog("complete")}
        onNoShow={() => setDialog("no_show")}
        onHire={() =>
          void runAction(
            async () => {
              const result =
                await interviewService.updateLinkedApplicationStatus(
                  interview.applicationId,
                  "hired",
                );
              return result.success
                ? { success: true }
                : { success: false, error: result.error };
            },
            "Candidate marked as Hired.",
          )
        }
        onReject={() =>
          void runAction(
            async () => {
              const result =
                await interviewService.updateLinkedApplicationStatus(
                  interview.applicationId,
                  "rejected",
                );
              return result.success
                ? { success: true }
                : { success: false, error: result.error };
            },
            "Candidate rejected.",
          )
        }
        onMessage={() => {
          void (async () => {
            const result = await messageService.getOrCreateForApplication(
              interview.applicationId,
            );
            if (!result.success) {
              toast.error(result.error);
              return;
            }
            router.push(EMPLOYER_MESSAGE_ROUTES.withConversation(result.data.id));
          })();
        }}
      />

      <CancelInterviewDialog
        open={dialog === "cancel"}
        loading={loading}
        onCancel={closeDialog}
        onConfirm={() =>
          void runAction(
            async () => {
              const result = await interviewService.cancelInterview(interviewId);
              return result.success
                ? { success: true }
                : { success: false, error: result.error };
            },
            "Interview cancelled.",
          )
        }
      />

      <CompleteInterviewDialog
        open={dialog === "complete"}
        loading={loading}
        onCancel={closeDialog}
        onConfirm={() =>
          void runAction(
            async () => {
              const result =
                await interviewService.completeInterview(interviewId);
              return result.success
                ? { success: true }
                : { success: false, error: result.error };
            },
            "Interview marked as completed.",
            { goToFeedback: true },
          )
        }
      />

      <NoShowInterviewDialog
        open={dialog === "no_show"}
        loading={loading}
        onCancel={closeDialog}
        onConfirm={() =>
          void runAction(
            async () => {
              const result = await interviewService.markNoShow(interviewId);
              return result.success
                ? { success: true }
                : { success: false, error: result.error };
            },
            "Candidate marked as no-show.",
          )
        }
      />
    </div>
  );
}
