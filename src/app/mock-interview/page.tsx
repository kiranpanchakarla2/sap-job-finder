import { Navbar } from "@/components/Navbar";
import { MockInterviewWizard } from "@/components/mock-interview/MockInterviewWizard";
import { PublicLayout } from "@/layouts/PublicLayout";

export default function MockInterviewPage() {
  return (
    <PublicLayout>
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-16 pt-28 sm:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-text">Mock Interview</h1>
        <p className="mt-1 text-sm text-muted">
          Practice SAP interview flows. AI scoring and live sessions arrive in Phase 3.
        </p>
        <div className="mt-8">
          <MockInterviewWizard />
        </div>
      </main>
    </PublicLayout>
  );
}
