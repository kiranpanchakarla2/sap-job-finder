import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { JobCard } from "@/components/jobs/JobCard";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { filterJobs } from "@/lib/mock-data";
import { sapModules } from "@/lib/constants";

type SearchParams = Promise<{
  q?: string;
  location?: string;
  module?: string;
  workMode?: string;
  saved?: string;
}>;

export default async function JobsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const jobs = filterJobs({
    q: params.q,
    location: params.location,
    module: params.module,
    workMode: params.workMode,
  });

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-screen max-w-6xl px-5 pb-16 pt-28 sm:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text">SAP Jobs</h1>
            <p className="mt-1 text-sm text-muted">
              {jobs.length} role{jobs.length === 1 ? "" : "s"} matching your filters
              {params.saved ? " · Saved jobs coming in Phase 2" : ""}
            </p>
          </div>
        </div>

        <form className="mt-6 grid gap-3 rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-soft sm:grid-cols-4">
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Keyword"
            className="rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
          <input
            name="location"
            defaultValue={params.location}
            placeholder="Location"
            className="rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
          <NativeSelect
            name="module"
            defaultValue={params.module ?? ""}
            className="rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All modules</option>
            {sapModules.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.name}
              </option>
            ))}
          </NativeSelect>
          <button
            type="submit"
            className="rounded-[var(--radius-button)] bg-primary px-4 py-2.5 text-sm font-semibold text-button-fg shadow-[var(--shadow-button)]"
          >
            Filter
          </button>
        </form>

        <div className="mt-8 grid gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
          {!jobs.length ? (
            <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-card px-6 py-16 text-center">
              <p className="font-semibold text-text">No roles match yet</p>
              <p className="mt-1 text-sm text-muted">Try clearing filters or browsing all modules.</p>
              <Link href="/jobs" className="mt-4 inline-block text-sm font-semibold text-primary">
                Clear filters
              </Link>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
}
