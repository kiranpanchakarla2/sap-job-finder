import { Briefcase, SearchX } from "lucide-react";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { Button } from "@/components/ui/Button";
import { EMPLOYER_JOB_ROUTES } from "../constants";

export function JobEmptyState({
  variant,
  onClearSearch,
}: {
  variant: "no-jobs" | "no-results";
  onClearSearch?: () => void;
}) {
  if (variant === "no-results") {
    return (
      <EmptyState
        icon={SearchX}
        title="No jobs match your search."
        description="Try a different keyword or clear your filters to see all postings."
        action={
          onClearSearch ? (
            <Button variant="secondary" onClick={onClearSearch}>
              Clear Search
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <EmptyState
      icon={Briefcase}
      title="Create your first SAP job posting"
      description="Reach qualified SAP professionals by publishing your first opportunity."
      action={<Button href={EMPLOYER_JOB_ROUTES.create}>Post a Job</Button>}
    />
  );
}
