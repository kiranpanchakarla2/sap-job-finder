import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FeaturedJobCard } from "@/components/jobs/FeaturedJobCard";
import { Reveal } from "@/components/ui/Reveal";
import { mockJobs } from "@/lib/mock-data";

export function FeaturedJobs() {
  const featured = mockJobs.filter((j) => j.featured).slice(0, 12);

  return (
    <section className="border-t border-border/60 bg-card py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Reveal>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-text sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
              Featured job
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <Link
              href="/jobs"
              className="inline-flex w-fit items-center gap-2 rounded-[var(--radius-control)] border border-border bg-card px-4 py-2.5 text-sm font-semibold text-primary transition hover:border-primary/30 hover:bg-primary/5"
            >
              View All
              <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((job, i) => (
            <Reveal key={job.id} delay={i * 0.03} className="h-full">
              <FeaturedJobCard job={job} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
