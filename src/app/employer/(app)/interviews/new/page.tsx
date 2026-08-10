import { Suspense } from "react";
import { ScheduleInterviewPage } from "@/features/employer-interviews";
import { InterviewDetailsSkeleton } from "@/features/employer-interviews/components/InterviewSkeletons";

export default function Page() {
  return (
    <Suspense fallback={<InterviewDetailsSkeleton />}>
      <ScheduleInterviewPage />
    </Suspense>
  );
}
