import { Search } from "lucide-react";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { Button } from "@/components/ui/Button";
import { EMPLOYER_TALENT_SEARCH_ROUTES } from "../constants";

export function TalentSearchEmptyState({
  onClearFilters,
}: {
  onClearFilters: () => void;
}) {
  return (
    <EmptyState
      icon={Search}
      title="No candidates found"
      description="Try adjusting your search or removing some filters."
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" variant="secondary" onClick={onClearFilters}>
            Clear Filters
          </Button>
          <Button type="button" onClick={onClearFilters}>
            Modify Search
          </Button>
        </div>
      }
    />
  );
}

export function SavedCandidatesEmptyState() {
  return (
    <EmptyState
      icon={Search}
      title="No saved candidates"
      description="Save candidates from Talent Search to access them quickly later."
      action={
        <Button href={EMPLOYER_TALENT_SEARCH_ROUTES.root}>Search Candidates</Button>
      }
    />
  );
}
