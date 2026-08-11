"use client";

import { Button } from "@/components/ui/Button";

export function TalentSearchPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (value) =>
      value === 1 ||
      value === totalPages ||
      Math.abs(value - page) <= 1,
  );

  const items: Array<number | "ellipsis"> = [];
  for (let i = 0; i < pages.length; i += 1) {
    const current = pages[i];
    const previous = pages[i - 1];
    if (i > 0 && previous !== undefined && current - previous > 1) {
      items.push("ellipsis");
    }
    items.push(current);
  }

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2"
      aria-label="Talent search pagination"
    >
      <Button
        type="button"
        variant="secondary"
        className="!px-3 !py-2 text-xs"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span key={`e-${index}`} className="px-1 text-sm text-muted">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-current={item === page ? "page" : undefined}
            aria-label={`Page ${item}`}
            onClick={() => onPageChange(item)}
            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-[var(--radius-control)] px-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
              item === page
                ? "bg-primary text-button-fg"
                : "border border-border bg-card text-text hover:bg-surface"
            }`}
          >
            {item}
          </button>
        ),
      )}
      <Button
        type="button"
        variant="secondary"
        className="!px-3 !py-2 text-xs"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}
