import { Suspense } from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { EmployerCandidatePageContent } from "@/features/talent-hub";
import { PublicLayout } from "@/layouts/PublicLayout";

export const metadata: Metadata = {
  title: "Candidate Profile | Talent Hub | SAP Jobs Finder",
  description:
    "View verified SAP candidate profile, module proficiencies, project experience, and certifications on SAP Jobs Finder Talent Hub.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function EmployerCandidateProfileRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PublicLayout>
      <Navbar />
      <main className="mx-auto max-w-7xl px-5 pb-16 pt-28 sm:px-8">
        <Suspense
          fallback={
            <div className="mx-auto max-w-5xl space-y-6 animate-pulse">
              <div className="h-5 w-48 rounded bg-card/60" />
              <div className="h-44 rounded-2xl bg-card/60 border border-border" />
            </div>
          }
        >
          <EmployerCandidatePageContent candidateId={id} />
        </Suspense>
      </main>
    </PublicLayout>
  );
}
