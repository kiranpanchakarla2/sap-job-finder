import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  Layers,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PublicLayout } from "@/layouts/PublicLayout";

export const metadata: Metadata = {
  title: "Our Mission | SAP Jobs Finder",
  description:
    "Learn about the mission, values, and vision behind SAP Jobs Finder — building a focused career and hiring ecosystem for SAP professionals.",
  openGraph: {
    title: "Our Mission | SAP Jobs Finder",
    description:
      "Learn about the mission, values, and vision behind SAP Jobs Finder — building a focused career and hiring ecosystem for SAP professionals.",
    type: "website",
  },
};

const missionPillars = [
  {
    icon: Search,
    title: "Streamlined SAP Job Discovery",
    description:
      "Filter and discover roles by specific SAP module, skill specialization, location, and work model without wading through thousands of irrelevant tech listings.",
  },
  {
    icon: Users,
    title: "Specialized Talent Discovery",
    description:
      "Provide a transparent discovery layer where employers can find verified SAP consultants and candidates control their visibility on their own terms.",
  },
  {
    icon: TrendingUp,
    title: "Holistic Career Growth",
    description:
      "Support the broader SAP career lifecycle with interview preparation, certification pathways, module guidance, and career milestone planning.",
  },
  {
    icon: Zap,
    title: "Noise-Free Relevance",
    description:
      "Eliminate generic job board clutter with dedicated taxonomy and domain structures tailored specifically to the enterprise SAP ecosystem.",
  },
];

const coreValues = [
  {
    title: "Ecosystem Focus",
    description:
      "We don't try to be everything for everyone. By focusing exclusively on SAP, we provide granular module taxonomies and career contexts that generalist platforms overlook.",
  },
  {
    title: "Candidate Autonomy",
    description:
      "Professionals should own their career journey. From private job searches to public Talent Hub discovery, candidates maintain full control over their presence.",
  },
  {
    title: "Hiring Transparency",
    description:
      "Clear module requirements, realistic experience bands, and direct employer connections reduce hiring friction for both candidates and recruiters.",
  },
  {
    title: "Community Growth",
    description:
      "SAP careers thrive on peer knowledge. We facilitate real-world implementation discussions, interview sharing, and collaborative learning.",
  },
];

export default function MissionPage() {
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
                <Target size={14} aria-hidden="true" />
                <span>Our Purpose & Vision</span>
              </div>
            </div>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-text sm:text-5xl sm:leading-[1.15] lg:text-6xl">
              Focused on Advancing the <span className="text-primary">SAP Ecosystem</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg sm:leading-relaxed">
              Generic job boards are noisy, fragmented, and lack understanding of enterprise SAP
              specializations. Our mission is to build a streamlined, transparent ecosystem centered
              entirely around SAP careers.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/jobs"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary px-7 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition hover:bg-primary/90 sm:w-auto"
              >
                <span>Explore SAP Jobs</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>

              <Link
                href="/why-sap-job-finder"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-border bg-card px-7 text-sm font-semibold text-text shadow-soft transition hover:border-primary/40 hover:bg-surface sm:w-auto"
              >
                <span>About the Platform</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Core Mission Manifesto Card */}
        <section className="border-b border-border/60 bg-surface/50 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <div className="rounded-[var(--radius-card)] border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-8 shadow-soft sm:p-12">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <Sparkles size={16} aria-hidden="true" />
                <span>The Core Belief</span>
              </div>

              <blockquote className="mt-4 text-xl font-semibold leading-relaxed text-text sm:text-2xl">
                &ldquo;An SAP career is specialized, high-impact, and continuous. Professionals and
                employers deserve a dedicated platform built around actual module requirements,
                domain competence, and long-term career growth.&rdquo;
              </blockquote>

              <div className="mt-6 border-t border-border/60 pt-6 text-sm text-muted">
                <p>
                  From S/4HANA migrations and BTP cloud integrations to module specializations in
                  FICO, MM, SD, and SuccessFactors, SAP Jobs Finder provides the dedicated home the
                  community needs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Pillars Grid */}
        <section className="border-b border-border/60 bg-background py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-text sm:text-3xl lg:text-4xl">
                How We Deliver on Our Mission
              </h2>
              <p className="mt-3 text-base text-muted">
                Key structural commitments that shape every feature we build on SAP Jobs Finder.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {missionPillars.map((pillar) => {
                const IconComponent = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    className="flex flex-col rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft transition hover:border-primary/30 hover:shadow-lift"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <IconComponent size={20} aria-hidden="true" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-text">{pillar.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{pillar.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="border-b border-border/60 bg-surface/50 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
                Our Core Principles
              </h2>
              <p className="mt-3 text-base text-muted">
                The values that guide our product decisions, privacy stance, and community focus.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {coreValues.map((value) => (
                <div
                  key={value.title}
                  className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft sm:p-8"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-primary shrink-0" aria-hidden="true" />
                    <h3 className="text-lg font-bold text-text">{value.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{value.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-accent transition"
              >
                <span>Have ideas on how we can improve? Let us know</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
