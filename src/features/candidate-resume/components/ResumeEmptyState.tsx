"use client";

import { FileUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";

export function ResumeEmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <EmptyState
      title="You haven't uploaded a resume yet"
      description="Upload your resume to make applying for SAP jobs faster and help recruiters understand your experience."
      icon={FileUp}
      action={
        <Button type="button" variant="primary" onClick={onUpload}>
          Upload Resume
        </Button>
      }
    />
  );
}
