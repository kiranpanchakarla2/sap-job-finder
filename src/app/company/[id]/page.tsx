import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { PublicLayout } from "@/layouts/PublicLayout";
import { JobCard } from "@/components/jobs/JobCard";
import { getCompanyById, mockJobs } from "@/lib/mock-data";

type Params = Promise<{ id: string }>;

export default async function CompanyDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const company = getCompanyById(id);
  if (!company) notFound();

  const jobs = mockJobs.filter((j) => j.companyId === company.id);

  return (
    <PublicLayout>
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-28 sm:px-8">
        <Link href="/companies" className="text-sm font-medium text-primary">
          ← All companies
        </Link>
        <div className="mt-6 flex items-start gap-4 rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
            {company.logo}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text">{company.name}</h1>
            <p className="mt-1 text-sm text-muted">{company.location}</p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              {company.description}
            </p>
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm font-semibold text-primary"
            >
              Visit website
            </a>
          </div>
        </div>

        <h2 className="mt-10 text-xl font-semibold text-text">Open roles</h2>
        <div className="mt-4 grid gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
          {!jobs.length ? (
            <p className="text-sm text-muted">No open roles listed right now.</p>
          ) : null}
        </div>
      </main>
    </PublicLayout>
  );
}
