import { Suspense } from "react";
import { ApplicantsPage } from "@/features/employer-applicants";
import { ApplicantTableSkeleton } from "@/features/employer-applicants/components/ApplicantSkeletons";

export default function Page() {
  return (
    <Suspense fallback={<ApplicantTableSkeleton />}>
      <ApplicantsPage />
    </Suspense>
  );
}
