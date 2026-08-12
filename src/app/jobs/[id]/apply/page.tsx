import { ApplyJobPage } from "@/features/candidate-applications";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function ApplyJobRoutePage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-screen max-w-[1840px] px-5 pb-16 pt-28 sm:px-8 lg:px-10">
        <ApplyJobPage />
      </main>
      <Footer />
    </>
  );
}
