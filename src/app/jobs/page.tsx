import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { JobSearchPage } from "@/features/candidate-jobs";
import { JobListSkeleton } from "@/features/candidate-jobs/components/JobStates";

export default function JobsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-screen max-w-6xl px-5 pb-16 pt-28 sm:px-8">
        <Suspense fallback={<JobListSkeleton count={5} />}>
          <JobSearchPage />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
