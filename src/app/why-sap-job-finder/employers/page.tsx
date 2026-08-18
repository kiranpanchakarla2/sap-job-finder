import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PublicLayout } from "@/layouts/PublicLayout";

export const metadata: Metadata = {
  title: "For Employers & Hiring Teams | SAP Jobs Finder",
  description:
    "Hire verified SAP talent with targeted job postings, Talent Hub candidate discovery, and streamlined recruiter tools built for the SAP ecosystem.",
  openGraph: {
    title: "For Employers & Hiring Teams | SAP Jobs Finder",
    description:
      "Hire verified SAP talent with targeted job postings, Talent Hub candidate discovery, and streamlined recruiter tools built for the SAP ecosystem.",
    type: "website",
  },
};

const employerFeatures = [
  {
    icon: Target,
    title: "100% Dedicated Audience",
    description:
      "Every candidate browsing SAP Jobs Finder is actively focused on the SAP ecosystem, eliminating unrelated generalist applications.",
  },
  {
    icon: Search,
    title: "Talent Hub Candidate Discovery",
    description:
      "Search discoverable SAP consultant and developer profiles by specific module, experience level, and work mode preferences.",
  },
  {
    icon: Zap,
    title: "Faster Time-to-Hire",
    description:
      "Pre-filtered module requirements and structured skill profiles allow your recruiting team to screen and shortlist faster.",
  },
  {
    icon: Building2,
    title: "Recruiter Dashboard",
    description:
      "Manage job postings, review applicants, track status, and coordinate candidate communications from a unified employer portal.",
  },
  {
    icon: Users,
    title: "Flexible Engagement Models",
    description:
      "Source talent for short-term contract implementations, long-term migration projects, or permanent enterprise leadership roles.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Skill Profiles",
    description:
      "Candidates highlight module specializations, certifications, and implementation experience directly on their profile.",
  },
];

function Target(props: React.ComponentProps<typeof Zap>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export default function EmployersPage() {
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
            <Link
              href="/why-sap-job-finder"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-primary mb-6"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              <span>Back to Why SAP Jobs Finder</span>
            </Link>

            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <Building2 size={14} aria-hidden="true" />
                <span>For Employers & Hiring Teams</span>
              </div>
            </div>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-text sm:text-5xl sm:leading-[1.15] lg:text-6xl">
              Hire Specialized SAP Talent <span className="text-primary">with Confidence</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg sm:leading-relaxed">
              Finding qualified SAP consultants, developers, and architects for complex
              implementations requires precision. Post openings and discover verified SAP
              professionals on SAP Jobs Finder.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/employer/login"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary px-7 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition hover:bg-primary/90 sm:w-auto"
              >
                <span>Post a Job</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>

              <Link
                href="/talent-hub"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-border bg-card px-7 text-sm font-semibold text-text shadow-soft transition hover:border-primary/40 hover:bg-surface sm:w-auto"
              >
                <Users size={16} className="text-primary" aria-hidden="true" />
                <span>Search SAP Talent</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Employer Value Props Grid */}
        <section className="border-b border-border/60 bg-surface/50 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-text sm:text-3xl lg:text-4xl">
                Built for Enterprise SAP Recruitment
              </h2>
              <p className="mt-3 text-base text-muted">
                Save hours of screening and connect directly with candidates possessing hands-on
                module competence.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {employerFeatures.map((feat) => {
                const IconComponent = feat.icon;
                return (
                  <div
                    key={feat.title}
                    className="flex flex-col rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft transition hover:border-primary/30 hover:shadow-lift"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <IconComponent size={20} aria-hidden="true" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-text">{feat.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{feat.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Call to action section */}
        <section className="border-b border-border/60 bg-background py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-5 sm:px-8 text-center">
            <div className="rounded-[var(--radius-card)] border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-8 shadow-soft sm:p-12">
              <h2 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
                Ready to find your next SAP specialist?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
                Create an employer account to post openings, review applicants, and connect with
                qualified SAP candidates.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/employer/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary px-7 py-3 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition hover:bg-primary/90"
                >
                  <span>Register as Employer</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>

                <Link
                  href="/contact"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] border border-border bg-surface px-6 py-3 text-sm font-semibold text-text hover:bg-card hover:border-primary/40 transition"
                >
                  <span>Contact Sales & Support</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
