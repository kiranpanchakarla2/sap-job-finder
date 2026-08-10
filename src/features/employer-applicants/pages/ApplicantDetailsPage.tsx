"use client";

import Link from "next/link";
import { ArrowLeft, Download, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { ApplicantAvatar } from "../components/ApplicantAvatar";
import { ApplicationDetails } from "../components/ApplicationDetails";
import { ApplicationStatusBadge } from "../components/ApplicationStatusBadge";
import { ApplicationTimeline } from "../components/ApplicationTimeline";
import { CandidateProfile } from "../components/CandidateProfile";
import { CandidateProfileSkeleton } from "../components/ApplicantSkeletons";
import { ChangeApplicationStatusDialog } from "../components/ChangeApplicationStatusDialog";
import { RejectApplicationDialog } from "../components/RejectApplicationDialog";
import { ApplicantInterviewPanel } from "../components/ApplicantInterviewPanel";
import { ResumeSection } from "../components/ResumeSection";
import { EMPLOYER_APPLICANT_ROUTES } from "../constants";
import {
  formatExperienceYears,
  formatJobContext,
} from "../lib/format";
import {
  canMarkReviewing,
  canReject,
  canShortlist,
} from "../lib/status";
import { useApplication } from "../hooks/useApplications";
import { useApplicationMutations } from "../hooks/useApplicationMutations";
import { applicationService } from "../services/applicationService";
import { useRouter } from "next/navigation";
import { EMPLOYER_INTERVIEW_ROUTES } from "@/features/employer-interviews/constants";
import { messageService } from "@/features/employer-messages";
import { EMPLOYER_MESSAGE_ROUTES } from "@/features/employer-messages/constants";

export function ApplicantDetailsPage({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const { application, isLoading, isError, error, reload } =
    useApplication(applicationId);

  const {
    confirmOpen,
    confirmTarget,
    confirmLoading,
    rejectReason,
    setRejectReason,
    closeConfirm,
    confirmReject,
    statusDialog,
    statusLoading,
    closeStatusDialog,
    openStatusDialog,
    updateStatusFromDialog,
    handleAction,
  } = useApplicationMutations(() => void reload());

  if (isLoading) {
    return <CandidateProfileSkeleton />;
  }

  if (isError || !application) {
    return (
      <ErrorState
        title="Unable to load applicant details."
        description={error ?? undefined}
        onRetry={() => void reload()}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          href={EMPLOYER_APPLICANT_ROUTES.list}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-primary"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to Applicants
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Candidate Profile
        </h1>
        <p className="mt-1 text-sm text-muted">
          Review candidate details and manage this application.
        </p>
      </div>

      <header className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <ApplicantAvatar
              name={application.candidateName}
              avatarUrl={application.avatarUrl}
              size="lg"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-text">
                  {application.candidateName}
                </h2>
                <ApplicationStatusBadge status={application.status} />
              </div>
              <p className="mt-1 text-sm text-muted">{application.currentRole}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} aria-hidden="true" />
                  {application.location}
                </span>
                <span>{formatExperienceYears(application.experienceYears)}</span>
                <span>
                  {application.appliedJobTitle} · {application.sapModule}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {formatJobContext({
                  location: application.jobLocation,
                  workArrangement: application.workArrangement,
                })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canMarkReviewing(application.status) ? (
              <Button
                variant="secondary"
                onClick={() => handleAction("review", application)}
              >
                Mark as Reviewing
              </Button>
            ) : null}
            {canShortlist(application.status) ? (
              <Button onClick={() => handleAction("shortlist", application)}>
                Shortlist
              </Button>
            ) : null}
            {application.status === "shortlisted" ? (
              <Button
                href={EMPLOYER_INTERVIEW_ROUTES.scheduleWithApplication(
                  application.id,
                )}
              >
                Schedule Interview
              </Button>
            ) : null}
            {application.status === "interview" ? (
              <Button
                href={EMPLOYER_INTERVIEW_ROUTES.list}
                variant="secondary"
              >
                Interview Scheduled
              </Button>
            ) : null}
            {canReject(application.status) ? (
              <Button
                variant="secondary"
                onClick={() => handleAction("reject", application)}
              >
                Reject
              </Button>
            ) : null}
            <Button
              variant="secondary"
              onClick={() => openStatusDialog(application)}
            >
              Change Status
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                void (async () => {
                  const result = await messageService.getOrCreateForApplication(
                    application.id,
                  );
                  if (!result.success) {
                    toast.error(result.error);
                    return;
                  }
                  router.push(
                    EMPLOYER_MESSAGE_ROUTES.withConversation(result.data.id),
                  );
                })();
              }}
            >
              Message
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                void (async () => {
                  const result = await applicationService.getResumeSignedUrl(
                    application.id,
                  );
                  if (!result.success) {
                    toast.error(result.error);
                    return;
                  }
                  const anchor = document.createElement("a");
                  anchor.href = result.data.url;
                  anchor.download = result.data.fileName;
                  anchor.target = "_blank";
                  anchor.rel = "noopener noreferrer";
                  document.body.appendChild(anchor);
                  anchor.click();
                  anchor.remove();
                })();
              }}
            >
              <Download size={15} aria-hidden="true" />
              Download Resume
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="space-y-4">
          <CandidateProfile application={application} />
          <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
            <h2 className="text-base font-semibold text-text">
              Application Timeline
            </h2>
            <div className="mt-4">
              <ApplicationTimeline events={application.timeline} />
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <ApplicantInterviewPanel
            applicationId={application.id}
            status={application.status}
          />
          <ApplicationDetails application={application} />
          <ResumeSection
            applicationId={application.id}
            resumeName={application.resumeName}
            resumePath={application.resumePath}
          />
        </aside>
      </div>

      <RejectApplicationDialog
        open={confirmOpen}
        application={confirmTarget}
        reason={rejectReason}
        loading={confirmLoading}
        onReasonChange={setRejectReason}
        onCancel={closeConfirm}
        onConfirm={() => void confirmReject()}
      />

      <ChangeApplicationStatusDialog
        open={statusDialog.open}
        application={statusDialog.application}
        loading={statusLoading}
        onCancel={closeStatusDialog}
        onConfirm={(nextStatus, notes) =>
          void updateStatusFromDialog(nextStatus, notes)
        }
      />
    </div>
  );
}
