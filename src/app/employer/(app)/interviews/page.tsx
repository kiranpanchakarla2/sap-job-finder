import { Suspense } from "react";
import { InterviewsPage } from "@/features/employer-interviews";
import { InterviewListSkeleton } from "@/features/employer-interviews/components/InterviewSkeletons";

export default function Page() {
  return (
    <Suspense fallback={<InterviewListSkeleton />}>
      <InterviewsPage />
    </Suspense>
  );
}
