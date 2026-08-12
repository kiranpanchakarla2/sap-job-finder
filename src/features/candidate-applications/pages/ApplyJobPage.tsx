"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { candidateJobService } from "@/features/candidate-jobs/services/candidateJobService";
import { getDiscoveryJobById, listActiveDiscoveryJobs } from "@/features/candidate-jobs/data/mockJobs";
import type { DiscoveryJob } from "@/features/candidate-jobs/types/job.types";
import { ConfirmDialog } from "@/features/candidate-resume/components/ConfirmDialog";
import { APPLICATION_STEPS } from "../constants";
import { resolveJobApplicationRequirements } from "../data/mockApplicationRequirements";
import { useApplications } from "../context/ApplicationsProvider";
import { candidateApplicationService } from "../services/candidateApplicationService";
import { createEmptyDraft, validateStep } from "../lib/applicationUtils";
import type { ApplicationDraft, ApplicationStepId } from "../types/application.types";
import { ApplicationProgress } from "../components/ApplicationProgress";
import { ApplicationQuestionsForm } from "../components/ApplicationQuestions";
import { ApplicationReview } from "../components/ApplicationReview";
import { ApplicationSummary } from "../components/ApplicationSummary";
import { CoverLetterEditor } from "../components/CoverLetterEditor";
import { ProfileCompletenessCheck } from "../components/ProfileCompletenessCheck";
import { ResumeSelector } from "../components/ResumeSelector";

function resolveJobLocally(jobId: string): DiscoveryJob | null {
  return getDiscoveryJobById(jobId) ?? listActiveDiscoveryJobs().find((j) => j.id === jobId) ?? null;
}

export function ApplyJobPage() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const jobId = params.id;
  const jobsBasePath = pathname?.startsWith("/candidate/jobs/") ? "/candidate/jobs" : "/jobs";
  const {
    getApplicationByJobId,
    getDraftByJobId,
    saveDraft,
    deleteDraft,
    submitApplication,
    resumes,
    hydrated,
  } = useApplications();

  const [job, setJob] = useState<DiscoveryJob | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [draft, setDraft] = useState<ApplicationDraft | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitFailureMessage, setSubmitFailureMessage] = useState<string | null>(null);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [confirmStartOver, setConfirmStartOver] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [databaseQuestions, setDatabaseQuestions] = useState<
    ReturnType<typeof resolveJobApplicationRequirements>["questions"] | null
  >(null);

  const existingApplication = getApplicationByJobId(jobId);
  const configuredRequirements = useMemo(
    () => resolveJobApplicationRequirements(jobId, job?.title),
    [jobId, job?.title],
  );
  const requirements = useMemo(
    () => ({
      ...configuredRequirements,
      questions: databaseQuestions ?? configuredRequirements.questions,
    }),
    [configuredRequirements, databaseQuestions],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingJob(true);
      const remote = await candidateJobService.getJobById(jobId);
      if (cancelled) return;
      if (remote.success && remote.data && remote.data.status === "active") {
        setJob(remote.data);
      } else {
        const local = resolveJobLocally(jobId);
        setJob(local && local.status === "active" ? local : null);
      }
      setLoadingJob(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  useEffect(() => {
    let cancelled = false;
    void candidateApplicationService.getJobApplicationQuestions(jobId).then((result) => {
      if (!cancelled && result.success) setDatabaseQuestions(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  useEffect(() => {
    if (!hydrated || !job || existingApplication) return;
    const existingDraft = getDraftByJobId(jobId);
    if (existingDraft) {
      setDraft(existingDraft);
      setShowDraftPrompt(true);
    } else {
      setDraft(createEmptyDraft(jobId));
    }
  }, [hydrated, job, jobId, existingApplication, getDraftByJobId]);

  const stepIndex = APPLICATION_STEPS.findIndex((s) => s.id === draft?.currentStep);

  const updateDraft = (patch: Partial<ApplicationDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
    setStepError(null);
    setSubmitFailureMessage(null);
  };

  const goToStep = (step: ApplicationStepId) => {
    updateDraft({ currentStep: step });
  };

  const continueNext = () => {
    if (!draft) return;
    const error = validateStep(draft.currentStep, draft, requirements, resumes);
    if (error) {
      setStepError(error);
      return;
    }
    const next = APPLICATION_STEPS[stepIndex + 1];
    if (next) goToStep(next.id);
  };

  const goBack = () => {
    const prev = APPLICATION_STEPS[stepIndex - 1];
    if (prev) goToStep(prev.id);
  };

  const onSubmit = async () => {
    if (!draft || !job) return;
    const error = validateStep("review", draft, requirements, resumes);
    if (error) {
      setStepError(error);
      return;
    }
    setSubmitting(true);
    setSubmitFailureMessage(null);
    try {
      const application = await submitApplication({ job, draft });
      setSuccessId(application.id);
    } catch (error) {
      setSubmitFailureMessage(
        error instanceof Error ? error.message : "We couldn't submit your application. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingJob || !hydrated) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse space-y-4 py-8">
        <div className="h-8 w-1/2 rounded bg-surface" />
        <div className="h-40 rounded-[var(--radius-card)] bg-surface" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-3xl rounded-[var(--radius-card)] border border-dashed border-border bg-card px-6 py-16 text-center shadow-soft">
        <h1 className="text-xl font-bold text-text">Job not found</h1>
        <p className="mt-2 text-sm text-muted">
          This job may no longer be available for applications.
        </p>
        <Button href={jobsBasePath} className="mt-6">
          Back to Jobs
        </Button>
      </div>
    );
  }

  if (existingApplication) {
    return (
      <div className="mx-auto max-w-3xl rounded-[var(--radius-card)] border border-border bg-card px-6 py-16 text-center shadow-soft">
        <h1 className="text-xl font-bold text-text">You already applied to this job.</h1>
        <p className="mt-2 text-sm text-muted">
          Track your progress from My Applications.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button href={`/candidate/applications/${existingApplication.id}`}>
            View Application
          </Button>
          <Button href={`${jobsBasePath}/${job.id}`} variant="secondary">
            View Job
          </Button>
        </div>
      </div>
    );
  }

  if (successId) {
    return (
      <div className="mx-auto max-w-3xl rounded-[var(--radius-card)] border border-border bg-card px-6 py-16 text-center shadow-soft">
        <h1 className="text-2xl font-bold text-text">Application Submitted!</h1>
        <p className="mt-3 text-sm text-muted">
          Your application for <strong>{job.title}</strong> has been submitted successfully.
        </p>
        <p className="mt-1 text-sm text-muted">
          Company: {job.companyName} · Submitted today
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button href={`/candidate/applications/${successId}`}>View Application</Button>
          <Button href={jobsBasePath} variant="secondary">
            Find More Jobs
          </Button>
          <Button href="/candidate/dashboard" variant="ghost">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!draft) return null;

  if (showDraftPrompt) {
    return (
      <div className="mx-auto max-w-3xl rounded-[var(--radius-card)] border border-border bg-card px-6 py-16 text-center shadow-soft">
        <h1 className="text-xl font-bold text-text">Continue your application</h1>
        <p className="mt-2 text-sm text-muted">
          You have a saved draft for {job.title}. Continue where you left off or start over.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={() => setShowDraftPrompt(false)}>
            Continue Application
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setConfirmStartOver(true)}
          >
            Start Over
          </Button>
        </div>
        <ConfirmDialog
          open={confirmStartOver}
          title="Start over?"
          description="This will delete your saved draft for this job."
          confirmLabel="Start Over"
          cancelLabel="Keep Draft"
          tone="danger"
          onCancel={() => setConfirmStartOver(false)}
          onConfirm={() => {
            deleteDraft(jobId);
            setDraft(createEmptyDraft(jobId));
            setConfirmStartOver(false);
            setShowDraftPrompt(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1840px] space-y-8 pb-28 lg:pb-10">
      <div>
        <Link href={`${jobsBasePath}/${job.id}`} className="text-sm font-medium text-primary">
          ← Back to job
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-text sm:text-4xl lg:text-5xl">
          Apply for {job.title}
        </h1>
        <p className="mt-2 text-base text-muted lg:text-xl">
          {job.companyName} · {job.location} · {job.workMode} · {job.experienceLabel}
        </p>
      </div>

      <ApplicationProgress currentStep={draft.currentStep} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,400px)] 2xl:grid-cols-[minmax(0,1fr)_470px]">
        <div className="space-y-6">
          {draft.currentStep === "details" ? (
            <>
              <ProfileCompletenessCheck />
              <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
                <h2 className="text-lg font-semibold text-text">Application Details</h2>
                <p className="mt-2 text-sm text-muted">
                  You&apos;re applying to <strong>{job.title}</strong> at{" "}
                  <strong>{job.companyName}</strong>. Next you&apos;ll choose a resume, add a
                  cover letter if needed, and answer any employer questions.
                </p>
              </section>
            </>
          ) : null}

          {draft.currentStep === "resume" ? (
            <ResumeSelector
              resumes={resumes}
              selectedResumeId={draft.resumeId}
              onSelect={(resumeId) => updateDraft({ resumeId: resumeId || null })}
              required={requirements.requiresResume}
            />
          ) : null}

          {draft.currentStep === "coverLetter" ? (
            <CoverLetterEditor
              value={draft.coverLetter}
              onChange={(coverLetter) => updateDraft({ coverLetter })}
              required={requirements.requiresCoverLetter}
              minChars={requirements.coverLetterMinChars}
              maxChars={requirements.coverLetterMaxChars}
            />
          ) : null}

          {draft.currentStep === "questions" ? (
            <ApplicationQuestionsForm
              questions={requirements.questions}
              answers={draft.answers}
              fieldError={stepError}
              onChange={(questionId, value) =>
                updateDraft({
                  answers: { ...draft.answers, [questionId]: value },
                })
              }
            />
          ) : null}

          {draft.currentStep === "review" ? (
            <ApplicationReview
              job={job}
              draft={draft}
              requirements={requirements}
              resumes={resumes}
              onEditStep={goToStep}
            />
          ) : null}

          {stepError ? (
            <p className="text-sm font-medium text-error" role="alert">
              {stepError}
            </p>
          ) : null}

          {submitFailureMessage ? (
            <p className="text-sm font-medium text-error" role="alert">
              {submitFailureMessage}
            </p>
          ) : null}
        </div>

        <ApplicationSummary job={job} className="h-fit lg:sticky lg:top-24" />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-3 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <div className="mx-auto flex max-w-[1840px] flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => {
              saveDraft(draft);
            }}
            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-button)] border border-border px-4 text-sm font-semibold text-muted hover:text-text"
          >
            Save & Continue Later
          </button>
          <div className="flex gap-2">
            {stepIndex > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-[var(--radius-button)] border border-border px-4 text-sm font-semibold text-text sm:flex-none"
              >
                Back
              </button>
            ) : null}
            {draft.currentStep !== "review" ? (
              <button
                type="button"
                onClick={continueNext}
                className="theme-btn-primary inline-flex h-10 flex-1 items-center justify-center rounded-[var(--radius-button)] px-5 text-sm font-semibold text-button-fg sm:flex-none"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void onSubmit()}
                className="theme-btn-primary inline-flex h-10 flex-1 items-center justify-center rounded-[var(--radius-button)] px-5 text-sm font-semibold text-button-fg disabled:opacity-60 sm:flex-none"
              >
                {submitting ? "Submitting application…" : "Submit Application"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
