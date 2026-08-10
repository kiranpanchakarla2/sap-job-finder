"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { InterviewCard } from "../components/InterviewCard";
import { InterviewEmptyState } from "../components/InterviewEmptyState";
import { InterviewFilters } from "../components/InterviewFilters";
import { InterviewListSkeleton } from "../components/InterviewSkeletons";
import { InterviewSummaryCards } from "../components/InterviewSummaryCards";
import { InterviewTable } from "../components/InterviewTable";
import { EMPLOYER_INTERVIEW_ROUTES } from "../constants";
import { useInterviews } from "../hooks/useInterviews";
import type { InterviewTabFilter } from "../types/interview.types";

export function InterviewsPage() {
  const [tab, setTab] = useState<InterviewTabFilter>("upcoming");
  const { interviews, stats, isLoading, isError, error, reload } =
    useInterviews(tab);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Interviews
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage upcoming and completed candidate interviews.
          </p>
        </div>
        <Button href={EMPLOYER_INTERVIEW_ROUTES.new}>
          <Plus size={16} aria-hidden="true" />
          Schedule Interview
        </Button>
      </div>

      {isLoading ? <InterviewListSkeleton /> : null}

      {isError ? (
        <ErrorState
          title="Unable to load interviews."
          description={error ?? undefined}
          onRetry={() => void reload()}
        />
      ) : null}

      {!isLoading && !isError ? (
        <>
          <InterviewSummaryCards stats={stats} />
          <InterviewFilters value={tab} onChange={setTab} />

          {interviews.length === 0 ? (
            <InterviewEmptyState tab={tab} />
          ) : (
            <>
              <InterviewTable interviews={interviews} />
              <div className="grid gap-3 md:hidden">
                {interviews.map((interview) => (
                  <InterviewCard key={interview.id} interview={interview} />
                ))}
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
