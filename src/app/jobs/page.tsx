import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { JobSearchPage } from "@/features/candidate-jobs";
import { JobListSkeleton } from "@/features/candidate-jobs/components/JobStates";
import { PublicLayout } from "@/layouts/PublicLayout";

export default function JobsPage() {
  return (
    <PublicLayout>
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-28 sm:px-8">
        <Suspense fallback={<JobListSkeleton count={5} />}>
          <JobSearchPage />
        </Suspense>
      </main>
    </PublicLayout>
  );
}
