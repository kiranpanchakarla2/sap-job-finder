"use client";

import Link from "next/link";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { Button } from "@/components/ui/Button";
import {
  FeatureLockCard,
  useEmployerPlan,
} from "@/features/employer-subscription";
import { CandidateProfileView } from "../components/CandidateProfileView";
import { CandidateProfileSkeleton } from "../components/TalentSearchSkeleton";
import { EMPLOYER_TALENT_SEARCH_ROUTES } from "../constants";
import { useTalentCandidate } from "../hooks/useTalentCandidate";

export function CandidateProfilePage({
  candidateId,
}: {
  candidateId: string;
}) {
  const { hasFeature, isLoading: planLoading } = useEmployerPlan();
  const { candidate, isLoading, isError, error, code, reload } =
    useTalentCandidate(candidateId, { enabled: hasFeature("talentSearch") });

  if (planLoading) {
    return <CandidateProfileSkeleton />;
  }

  if (!hasFeature("talentSearch")) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <FeatureLockCard
          title="Talent Search"
          description="Talent Search is available with Pro and Business plans."
        />
        <div className="text-center">
          <Button
            href={EMPLOYER_TALENT_SEARCH_ROUTES.root}
            variant="secondary"
          >
            Back to Talent Search
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <CandidateProfileSkeleton />;
  }

  if (code === "TALENT_SEARCH_NOT_AVAILABLE") {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <FeatureLockCard
          title="Talent Search"
          description="Talent Search is available with Pro and Business plans."
        />
        <div className="text-center">
          <Button
            href={EMPLOYER_TALENT_SEARCH_ROUTES.root}
            variant="secondary"
          >
            Back to Talent Search
          </Button>
        </div>
      </div>
    );
  }

  if (code === "TALENT_SEARCH_LIMIT_REACHED") {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState
          title="Talent Search limit reached"
          description="You've reached your Talent Search limit for this period."
          action={
            <div className="flex flex-wrap gap-2">
              <Button href="/employer/subscription">View Plans</Button>
              <Button href={EMPLOYER_TALENT_SEARCH_ROUTES.root} variant="secondary">
                Back to Talent Search
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  if (code === "CANDIDATE_NOT_AVAILABLE") {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState
          title="Candidate unavailable"
          description="This candidate is no longer available."
          action={
            <Button href={EMPLOYER_TALENT_SEARCH_ROUTES.root}>
              Back to Talent Search
            </Button>
          }
        />
      </div>
    );
  }

  if (isError || !candidate) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState
          title="Unable to load candidates."
          description={error ?? undefined}
          onRetry={reload}
        />
      </div>
    );
  }

  return <CandidateProfileView candidate={candidate} />;
}
