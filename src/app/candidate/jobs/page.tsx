import { Suspense } from "react";
import { JobSearchPage } from "@/features/candidate-jobs";
import { JobListSkeleton } from "@/features/candidate-jobs/components/JobStates";

/** Authenticated candidate job search — reuses public JobSearchPage UI. */
export default function CandidateJobsPage() {
  return (
    <Suspense fallback={<JobListSkeleton count={5} />}>
      <JobSearchPage />
    </Suspense>
  );
}
