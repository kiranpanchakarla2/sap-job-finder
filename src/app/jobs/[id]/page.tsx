import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ApplyButton } from "@/components/jobs/ApplyButton";
import { Button } from "@/components/ui/Button";
import { getJobById } from "@/lib/mock-data";

type Params = Promise<{ id: string }>;

export default async function JobDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const job = getJobById(id);
  if (!job) notFound();

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-screen max-w-6xl px-5 pb-16 pt-28 sm:px-8">
        <Link href="/jobs" className="text-sm font-medium text-primary">
          ← Back to jobs
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
          <article className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary">
                {job.logo}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
                  {job.title}
                </h1>
                <p className="mt-1 text-muted">
                  <Link href={`/company/${job.companyId}`} className="hover:text-primary">
                    {job.company}
                  </Link>
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3 text-sm text-muted">
              <span className="inline-flex items-center gap-1">
                <MapPin size={15} /> {job.location}
              </span>
              <span>{job.salary}</span>
              <span>{job.experience}</span>
              <span>{job.workMode}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {job.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-badge px-3 py-1 text-xs font-medium text-badge-fg"
                >
                  {s}
                </span>
              ))}
            </div>

            <section className="mt-8">
              <h2 className="text-lg font-semibold text-text">Description</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{job.description}</p>
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-semibold text-text">Requirements</h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted">
                {job.requirements.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-semibold text-text">Benefits</h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted">
                {job.benefits.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </section>
          </article>

          <aside className="h-fit rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft lg:sticky lg:top-24">
            <p className="text-sm text-muted">Ready to apply?</p>
            <p className="mt-1 text-lg font-semibold text-text">{job.salary}</p>
            <div className="mt-4 flex flex-col gap-2">
              <ApplyButton jobId={job.id} />
              <Button variant="secondary" type="button" title="Coming in Phase 2">
                Save Job
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted">Posted {job.postedAt}</p>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
