import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JobCard } from "@/components/jobs/JobCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { mockJobs } from "@/lib/mock-data";

export function LatestJobs() {
  const latest = mockJobs.slice(0, 4);

  return (
    <section className="border-t border-border/60 bg-surface/40 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <Reveal>
            <SectionHeading
              align="left"
              eyebrow="Fresh"
              title="Latest Jobs"
              description="Newly posted opportunities across the SAP stack."
              className="mb-0"
            />
          </Reveal>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition hover:opacity-80"
          >
            Browse jobs <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-10 grid auto-rows-fr gap-5 md:grid-cols-2">
          {latest.map((job, i) => (
            <Reveal key={job.id} delay={i * 0.04} className="h-full">
              <JobCard job={job} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
