"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CandidateContactView } from "@/features/contact";
import { Loader2 } from "lucide-react";
import type { ContactRequestCategory } from "@/types/contact";

function CandidateContactContent() {
  const searchParams = useSearchParams();

  const categoryParam = searchParams.get("category") as ContactRequestCategory | null;
  const subjectParam = searchParams.get("subject") || undefined;
  const messageParam = searchParams.get("message") || undefined;
  const jobIdParam = searchParams.get("jobId") || undefined;
  const jobTitleParam = searchParams.get("jobTitle") || undefined;
  const applicationIdParam = searchParams.get("applicationId") || undefined;

  return (
    <CandidateContactView
      initialCategory={categoryParam || undefined}
      initialSubject={subjectParam}
      initialMessage={messageParam}
      jobId={jobIdParam}
      jobTitle={jobTitleParam}
      applicationId={applicationIdParam}
    />
  );
}

export default function CandidateContactPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading contact form" />
        </div>
      }
    >
      <CandidateContactContent />
    </Suspense>
  );
}
