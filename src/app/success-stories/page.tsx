import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  GraduationCap,
  Quote,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PublicLayout } from "@/layouts/PublicLayout";
import { testimonials } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Success Stories | SAP Jobs Finder",
  description:
    "Read inspiring career transformation stories and testimonials from SAP professionals who found their next opportunity through SAP Jobs Finder.",
  openGraph: {
    title: "Success Stories | SAP Jobs Finder",
    description:
      "Read inspiring career transformation stories and testimonials from SAP professionals who found their next opportunity through SAP Jobs Finder.",
    type: "website",
  },
};

const detailedStories = [
  {
    name: "Vikram R.",
    role: "Senior SAP FICO Consultant",
    company: "Global System Integrator",
    module: "SAP FICO / S/4HANA Finance",
    story:
      "Transitioning from ECC 6.0 to a full-lifecycle S/4HANA Finance implementation was my main career goal. On generalist boards, I received endless irrelevant recruiter messages. On SAP Jobs Finder, I filtered specifically for S/4HANA migration projects and connected directly with an enterprise hiring manager in under two weeks.",
    outcome: "Landed Lead FICO Role with 35% compensation increase",
  },
  {
    name: "Pooja S.",
    role: "SAP BTP & ABAP Cloud Developer",
    company: "Cloud Solutions Partner",
    module: "SAP BTP / ABAP RAP",
    story:
      "After completing my BTP and RAP certifications, I wanted a fully remote developer role where I could work on modern extensibility rather than legacy code. Talent Hub gave me the visibility I needed while keeping my profile private until recruiters matched my module criteria.",
    outcome: "Secured Remote BTP Lead Developer position",
  },
  {
    name: "Ananya M.",
    role: "SAP SuccessFactors Lead",
    company: "Enterprise HR Tech",
    module: "Employee Central & PMGM",
    story:
      "The community interview experiences and module guidance gave me the exact context I needed for multi-round partner interviews. Having transparent salary reports and clear module scopes made the entire job search empowering and straightforward.",
    outcome: "Hired as Principal SuccessFactors Consultant",
  },
];

export default function SuccessStoriesPage() {
  return (
    <PublicLayout>
      <Navbar />

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-background via-surface/70 to-background pb-16 pt-28 sm:pb-20 sm:pt-36">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/15 via-accent/10 to-transparent blur-3xl"
          />

          <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles size={14} aria-hidden="true" />
              <span>Community Stories</span>
            </div>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-text sm:text-5xl sm:leading-[1.15] lg:text-6xl">
              Real Stories from the <span className="text-primary">SAP Community</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg sm:leading-relaxed">
              How SAP consultants, developers, and architects used SAP Jobs Finder to transition
              modules, land remote opportunities, and advance their careers.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/jobs"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary px-7 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition hover:bg-primary/90 sm:w-auto"
              >
                <span>Find Your Next SAP Role</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>

              <Link
                href="/talent-hub"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-border bg-card px-7 text-sm font-semibold text-text shadow-soft transition hover:border-primary/40 hover:bg-surface sm:w-auto"
              >
                <span>Join Talent Hub</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Case Studies */}
        <section className="border-b border-border/60 bg-surface/50 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-text sm:text-3xl lg:text-4xl">
                Featured Career Transformations
              </h2>
              <p className="mt-3 text-base text-muted">
                Detailed breakdowns of how practitioners leveled up their SAP careers.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {detailedStories.map((story) => (
                <article
                  key={story.name}
                  className="flex flex-col justify-between rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft transition hover:border-primary/30 hover:shadow-lift sm:p-8"
                >
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                      <span>{story.module}</span>
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-text">{story.name}</h3>
                    <p className="text-xs font-medium text-muted">{story.role}</p>

                    <p className="mt-4 text-sm leading-relaxed text-muted">&ldquo;{story.story}&rdquo;</p>
                  </div>

                  <div className="mt-6 border-t border-border/60 pt-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                      <CheckCircle2 size={15} className="shrink-0 text-emerald-500" aria-hidden="true" />
                      <span>{story.outcome}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Grid */}
        <section className="border-b border-border/60 bg-background py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
                Candidate Reviews & Feedback
              </h2>
              <p className="mt-3 text-base text-muted">
                What practitioners across different modules say about SAP Jobs Finder.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((item) => (
                <div
                  key={item.id}
                  className="relative flex flex-col justify-between rounded-[var(--radius-card)] border border-border/80 bg-card p-6 shadow-soft sm:p-7"
                >
                  <div>
                    <div className="flex gap-0.5" aria-label={`${item.rating} out of 5 stars`}>
                      {Array.from({ length: item.rating }).map((_, i) => (
                        <Star key={i} size={16} className="fill-amber-400 text-amber-400" aria-hidden />
                      ))}
                    </div>

                    <p className="mt-4 text-sm leading-relaxed text-muted">&ldquo;{item.quote}&rdquo;</p>
                  </div>

                  <div className="mt-6 flex items-center gap-3 border-t border-border/60 pt-4">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: item.avatarColor }}
                    >
                      {item.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text">{item.name}</p>
                      <p className="text-xs text-muted">{item.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA Banner */}
            <div className="mt-16 rounded-[var(--radius-card)] border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-8 shadow-soft sm:p-10 text-center">
              <h3 className="text-xl font-bold text-text sm:text-2xl">
                Ready to write your own SAP success story?
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-sm text-muted">
                Explore thousands of active roles across SAP modules and connect with verified employers.
              </p>
              <div className="mt-6 flex justify-center">
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-primary px-7 py-3 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition hover:bg-primary/90"
                >
                  <span>Explore SAP Jobs</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
