import { Navbar } from "@/components/Navbar";
import { JobDetailsPage } from "@/features/candidate-jobs";
import { PublicLayout } from "@/layouts/PublicLayout";

export default function JobDetailRoutePage() {
  return (
    <PublicLayout>
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-28 sm:px-8">
        <JobDetailsPage />
      </main>
    </PublicLayout>
  );
}
