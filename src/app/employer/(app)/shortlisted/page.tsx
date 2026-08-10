import { Suspense } from "react";
import { ApplicantsPage } from "@/features/employer-applicants";
import { ApplicantTableSkeleton } from "@/features/employer-applicants/components/ApplicantSkeletons";

export default function Page() {
  return (
    <Suspense fallback={<ApplicantTableSkeleton />}>
      <ApplicantsPage
        lockedStatus="shortlisted"
        pageTitle="Shortlisted"
        pageSubtitle="Candidates you have shortlisted for further review."
      />
    </Suspense>
  );
}
