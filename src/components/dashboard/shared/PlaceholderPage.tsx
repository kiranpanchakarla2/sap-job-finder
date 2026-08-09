import Link from "next/link";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";

export function PlaceholderPage({
  title,
  description,
  backHref,
  backLabel = "Back to dashboard",
}: {
  title: string;
  description: string;
  backHref: string;
  backLabel?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">{title}</h1>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <EmptyState
        title="Coming soon"
        description="This section is ready for backend integration. Navigation and layout are in place."
        action={
          <Link
            href={backHref}
            className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white"
          >
            {backLabel}
          </Link>
        }
      />
    </div>
  );
}
