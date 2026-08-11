"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function TalentSearchBar({
  value,
  onChange,
  onSearch,
}: {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}) {
  return (
    <form
      className="flex w-full flex-col gap-2 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch();
      }}
    >
      <div className="relative min-w-0 flex-1">
        <label htmlFor="talent-search-input" className="sr-only">
          Search by skills, job title, SAP module, or keywords
        </label>
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          id="talent-search-input"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search by skills, job title, SAP module, or keywords"
          className="h-12 w-full rounded-2xl border border-border bg-input py-2 pl-10 pr-4 text-sm font-medium text-input-fg outline-none transition placeholder:text-muted focus:border-primary focus-visible:ring-4 focus-visible:ring-primary/20"
        />
      </div>
      <Button type="submit" className="h-12 shrink-0 sm:px-8">
        Search
      </Button>
    </form>
  );
}
