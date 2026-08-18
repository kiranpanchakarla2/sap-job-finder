import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  FileCheck,
  GraduationCap,
  Layers,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PublicLayout } from "@/layouts/PublicLayout";

export const metadata: Metadata = {
  title: "For SAP Professionals | SAP Jobs Finder",
  description:
    "Discover SAP jobs, build a discoverable profile in Talent Hub, connect with the SAP community, and advance your career across specialized modules.",
  openGraph: {
    title: "For SAP Professionals | SAP Jobs Finder",
    description:
      "Discover SAP jobs, build a discoverable profile in Talent Hub, connect with the SAP community, and advance your career across specialized modules.",
    type: "website",
  },
};

const candidateBenefits = [
  {
    icon: Search,
    title: "Module-Specific Discovery",
    description:
      "Search opportunities tailored to your exact SAP domain — FICO, MM, SD, ABAP, BTP, SuccessFactors, S/4HANA, Basis, and beyond.",
  },
  {
    icon: UserCheck,
    title: "Talent Hub Presence",
    description:
      "Build your SAP professional profile and decide whether to appear in the searchable Talent Hub for direct employer outreach.",
  },
  {
    icon: ShieldCheck,
    title: "Full Privacy Control",
    description:
      "Keep your profile completely private, open to select opportunities, or visible to verified employers on your own terms.",
  },
  {
    icon: TrendingUp,
    title: "Career & Interview Guidance",
    description:
      "Access module roadmaps, mock tests, and interview insights as new career services continue to roll out.",
  },
  {
    icon: MessageSquare,
    title: "Peer Community",
    description:
      "Share and read real-world SAP interview experiences, module migration challenges, and project discussions.",
  },
  {
    icon: Compass,
    title: "Flexible Work Modes",
    description:
      "Easily filter by remote SAP contracts, hybrid enterprise roles, or permanent onsite consulting positions.",
  },
];

const popularModules = [
  { name: "SAP FICO", desc: "Financial Accounting & Controlling" },
  { name: "SAP MM", desc: "Materials Management & Procurement" },
  { name: "SAP SD", desc: "Sales & Distribution" },
  { name: "SAP ABAP", desc: "Core ABAP, OO ABAP, RAP & CAP" },
  { name: "SAP BTP", desc: "Business Technology Platform & Cloud" },
  { name: "SAP SuccessFactors", desc: "Human Experience Management (HXM)" },
  { name: "SAP S/4HANA", desc: "Enterprise Cloud & On-Premise" },
  { name: "SAP Basis", desc: "System Administration & Infrastructure" },
];

export default function CandidatesPage() {
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
                <GraduationCap size={14} aria-hidden="true" />
                <span>For SAP Professionals</span>
              </div>
            </div>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-text sm:text-5xl sm:leading-[1.15] lg:text-6xl">
              Your SAP Career Is <span className="text-primary">More Than a Job Search</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg sm:leading-relaxed">
              Whether you are an SAP Consultant, Developer, or Enterprise Architect, discover
              relevant opportunities, build your professional presence, and connect with the SAP
              community.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/jobs"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary px-7 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition hover:bg-primary/90 sm:w-auto"
              >
                <span>Browse SAP Jobs</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>

              <Link
                href="/talent-hub"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-border bg-card px-7 text-sm font-semibold text-text shadow-soft transition hover:border-primary/40 hover:bg-surface sm:w-auto"
              >
                <span>Explore Talent Hub</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Candidate Journey Grid */}
        <section className="border-b border-border/60 bg-surface/50 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-text sm:text-3xl lg:text-4xl">
                Built Around the SAP Candidate Journey
              </h2>
              <p className="mt-3 text-base text-muted">
                Tools and capabilities tailored to your specialized skills and career ambitions.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {candidateBenefits.map((benefit) => {
                const IconComponent = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    className="flex flex-col rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft transition hover:border-primary/30 hover:shadow-lift"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <IconComponent size={20} aria-hidden="true" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-text">{benefit.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Browse by SAP Specialization */}
        <section className="border-b border-border/60 bg-background py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
                Find Roles Across Key SAP Domains
              </h2>
              <p className="mt-3 text-base text-muted">
                Direct access to opportunities organized by functional and technical specialization.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {popularModules.map((mod) => (
                <Link
                  key={mod.name}
                  href={`/jobs?module=${encodeURIComponent(mod.name)}`}
                  className="group flex flex-col rounded-[var(--radius-card)] border border-border/80 bg-surface/40 p-5 transition hover:border-primary/50 hover:bg-card hover:shadow-soft"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text group-hover:text-primary transition-colors">
                      {mod.name}
                    </span>
                    <ArrowRight size={14} className="text-muted group-hover:text-primary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-xs text-muted leading-relaxed">{mod.desc}</p>
                </Link>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/success-stories"
                className="inline-flex items-center gap-2 rounded-[var(--radius-button)] border border-border bg-card px-6 py-3 text-sm font-semibold text-text hover:border-primary/40 hover:bg-surface transition shadow-soft"
              >
                <span>Read SAP Candidate Success Stories</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
