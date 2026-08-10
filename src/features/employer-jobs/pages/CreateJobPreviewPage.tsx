"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { JobPreviewView } from "../components/JobPreviewView";
import { EMPLOYER_JOB_ROUTES } from "../constants";
import { formValuesToPreviewJob } from "../lib/formPreviewJob";
import { clearPreviewDraft, loadPreviewDraft } from "../lib/previewDraft";
import type { EmployerJobRecord } from "../types/job.types";

export function CreateJobPreviewPage() {
  const router = useRouter();
  const [job, setJob] = useState<EmployerJobRecord | null>(null);

  useEffect(() => {
    const draft = loadPreviewDraft();
    if (!draft) {
      router.replace(EMPLOYER_JOB_ROUTES.create);
      return;
    }
    setJob(
      formValuesToPreviewJob(draft.values, {
        companyName: draft.companyName,
        logoUrl: draft.logoUrl,
      }),
    );
    return () => {
      clearPreviewDraft();
    };
  }, [router]);

  if (!job) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Job Preview
          </h1>
          <p className="mt-1 text-sm text-muted">
            Preview how candidates will see this opportunity before saving.
          </p>
        </div>
        <Button variant="secondary" href={EMPLOYER_JOB_ROUTES.create}>
          Back to Form
        </Button>
      </div>
      <JobPreviewView job={job} />
    </div>
  );
}
