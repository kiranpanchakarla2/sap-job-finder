"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { SkeletonCard } from "@/components/dashboard/shared/Skeleton";
import { applicationService } from "@/features/employer-applicants";
import { ScheduleInterviewForm } from "../components/ScheduleInterviewForm";
import { EMPLOYER_INTERVIEW_ROUTES } from "../constants";
import { useShortlistedCandidates } from "../hooks/useInterviews";
import { interviewService } from "../services/interviewService";
import type {
  ScheduleInterviewInput,
  ShortlistedCandidateOption,
} from "../types/interview.types";

export function ScheduleInterviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedApplicationId = searchParams.get("application");
  const { candidates, isLoading, isError, error, reload } =
    useShortlistedCandidates();
  const [saving, setSaving] = useState(false);
  const [preselected, setPreselected] =
    useState<ShortlistedCandidateOption | null>(null);

  useEffect(() => {
    if (!preselectedApplicationId) {
      setPreselected(null);
      return;
    }
    if (candidates.some((c) => c.applicationId === preselectedApplicationId)) {
      setPreselected(null);
      return;
    }

    void (async () => {
      const result = await applicationService.getApplication(
        preselectedApplicationId,
      );
      if (!result.success || !result.data) return;
      const application = result.data;
      if (application.status === "hired" || application.status === "rejected") {
        return;
      }
      setPreselected({
        applicationId: application.id,
        candidateId: application.candidateId,
        candidateName: application.candidateName,
        candidateAvatarUrl: application.avatarUrl,
        candidateRole: application.currentRole,
        candidateExperienceYears: application.experienceYears,
        candidateSapSkills: application.sapSkills,
        candidateLocation: application.location,
        jobId: application.appliedJobId,
        jobTitle: application.appliedJobTitle,
        sapModule: application.sapModule,
        jobLocation: application.jobLocation,
        employmentType: application.employmentType,
        applicationStatus:
          application.status === "interview" ? "interview" : "shortlisted",
      });
    })();
  }, [candidates, preselectedApplicationId]);

  const candidateOptions = useMemo(() => {
    const byId = new Map<string, ShortlistedCandidateOption>();
    for (const candidate of candidates) {
      byId.set(candidate.applicationId, candidate);
    }
    if (preselected) {
      byId.set(preselected.applicationId, preselected);
    }
    return Array.from(byId.values());
  }, [candidates, preselected]);

  const handleSubmit = async (input: ScheduleInterviewInput) => {
    setSaving(true);
    const result = await interviewService.scheduleInterview(input);
    setSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Interview scheduled successfully.");
    router.push(EMPLOYER_INTERVIEW_ROUTES.details(result.data.id));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={EMPLOYER_INTERVIEW_ROUTES.list}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-primary"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to Interviews
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Schedule Interview
        </h1>
        <p className="mt-1 text-sm text-muted">
          Choose a shortlisted candidate and set interview details.
        </p>
      </div>

      {isLoading ? <SkeletonCard className="h-96" /> : null}

      {isError ? (
        <ErrorState
          title="Unable to load shortlisted candidates."
          description={error ?? undefined}
          onRetry={() => void reload()}
        />
      ) : null}

      {!isLoading && !isError ? (
        <ScheduleInterviewForm
          mode="create"
          candidates={candidateOptions}
          initialApplicationId={preselectedApplicationId}
          loading={saving}
          onCancel={() => router.push(EMPLOYER_INTERVIEW_ROUTES.list)}
          onSubmitCreate={handleSubmit}
        />
      ) : null}
    </div>
  );
}
