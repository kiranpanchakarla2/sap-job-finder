import { ApplyJobPage } from "@/features/candidate-applications";
import { Navbar } from "@/components/Navbar";
import { PublicLayout } from "@/layouts/PublicLayout";

export default function ApplyJobRoutePage() {
  return (
    <PublicLayout>
      <Navbar />
      <main className="mx-auto max-w-[1840px] px-5 pb-16 pt-28 sm:px-8 lg:px-10">
        <ApplyJobPage />
      </main>
    </PublicLayout>
  );
}
