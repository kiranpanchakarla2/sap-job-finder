import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { JobDetailsPage } from "@/features/candidate-jobs";

export default function JobDetailRoutePage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-screen max-w-6xl px-5 pb-16 pt-28 sm:px-8">
        <JobDetailsPage />
      </main>
      <Footer />
    </>
  );
}
