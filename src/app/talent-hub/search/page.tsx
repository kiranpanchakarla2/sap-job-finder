import { Suspense } from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { PublicTalentSearchPage } from "@/features/talent-hub";
import { PublicLayout } from "@/layouts/PublicLayout";

export const metadata: Metadata = {
  title: "Talent Search | Discover SAP Talent | SAP Jobs Finder",
  description:
    "Search and discover specialized SAP professionals, consultants, developers, and architects across modules and locations on SAP Jobs Finder Talent Hub.",
  openGraph: {
    title: "Talent Search | Discover SAP Talent | SAP Jobs Finder",
    description:
      "Search and discover specialized SAP professionals, consultants, developers, and architects across modules and locations on SAP Jobs Finder Talent Hub.",
    type: "website",
  },
};

export default function TalentSearchRoutePage() {
  return (
    <PublicLayout>
      <Navbar />
      <main className="mx-auto max-w-7xl px-5 pb-16 pt-28 sm:px-8">
        <Suspense
          fallback={
            <div className="space-y-6 animate-pulse">
              <div className="h-12 w-full rounded-xl bg-card/60" />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-2xl bg-card/60" />
                ))}
              </div>
            </div>
          }
        >
          <PublicTalentSearchPage />
        </Suspense>
      </main>
    </PublicLayout>
  );
}
