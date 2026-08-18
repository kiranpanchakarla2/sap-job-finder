import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Compass,
  GraduationCap,
  Layers,
  MessageSquare,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ContactForm, ContactInfoCard } from "@/features/contact";
import { PublicLayout } from "@/layouts/PublicLayout";

export const metadata: Metadata = {
  title: "Why SAP Jobs Finder? | SAP Jobs, Talent & Career Growth",
  description:
    "Discover how SAP Jobs Finder connects SAP professionals with jobs, talent opportunities, career growth, and the SAP community.",
  openGraph: {
    title: "Why SAP Jobs Finder? | SAP Jobs, Talent & Career Growth",
    description:
      "Discover how SAP Jobs Finder connects SAP professionals with jobs, talent opportunities, career growth, and the SAP community.",
    type: "website",
  },
};

const missionPillars = [
  {
    icon: Search,
    title: "Streamlined SAP Job Discovery",
    description:
      "Filter and discover roles by specific SAP module, skill specialization, location, and work model without wading through irrelevant tech listings.",
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

const platformPillars = [
  {
    icon: Briefcase,
    title: "SAP Jobs",
    href: "/jobs",
    cta: "Explore Jobs",
    status: "Active",
    description:
      "A dedicated destination to browse and apply for SAP opportunities across core ERP, Cloud ERP, S/4HANA, BTP, ABAP, Fiori, and line-of-business solutions.",
    features: [
      "Filter by SAP module and sub-skills",
      "Remote, hybrid, and onsite options",
      "Contract and permanent opportunities",
      "Direct application workflow",
    ],
  },
  {
    icon: UserCheck,
    title: "Talent Hub",
    href: "/talent-hub",
    cta: "Explore Talent Hub",
    status: "Active",
    description:
      "A two-sided discovery marketplace where employers search for specialized SAP talent, and professionals build verified, discoverable career profiles.",
    features: [
      "Searchable SAP consultant directory",
      "Granular module and skill filters",
      "Candidate-controlled visibility settings",
      "Direct employer candidate discovery",
    ],
  },
  {
    icon: GraduationCap,
    title: "Career Growth",
    href: "/services",
    cta: "Explore Services",
    status: "Growing",
    description:
      "A growing suite of resources and guidance designed to support SAP professionals throughout interview preparation, certifications, and career transitions.",
    features: [
      "SAP interview preparation & mock tests",
      "Certification roadmap guidance",
      "Resume and portfolio reviews",
      "Career coaching for SAP specialists",
    ],
  },
  {
    icon: Users,
    title: "SAP Community",
    href: "/community",
    cta: "Explore Community",
    status: "Active",
    description:
      "A collaborative environment for SAP practitioners to share real-world implementation experiences, interview insights, and module best practices.",
    features: [
      "Module-focused discussions",
      "Verified interview experiences",
      "Peer networking and knowledge exchange",
      "Success stories and advice",
    ],
  },
];

const benefitCards = [
  {
    icon: Target,
    title: "SAP Focused",
    description:
      "Built exclusively around SAP careers rather than attempting to cover every generic technology stack and industry.",
  },
  {
    icon: CheckCircle2,
    title: "Relevant Opportunities",
    description:
      "Connect with openings and employers that match your specific module competence, version experience, and career trajectory.",
  },
  {
    icon: UserCheck,
    title: "SAP Talent Discovery",
    description:
      "Help enterprises and consulting partners discover verified SAP professionals with exact module capabilities through Talent Hub.",
  },
  {
    icon: Compass,
    title: "Career Beyond Jobs",
    description:
      "Support for your long-term SAP journey — from your first certification to module lead and enterprise architecture roles.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description:
      "Gain authentic insights from fellow practitioners about employer cultures, interview processes, and module trends.",
  },
  {
    icon: Layers,
    title: "Growing Ecosystem",
    description:
      "Continually expanding with specialized career tools, mock test series, and dedicated services tailored for SAP experts.",
  },
];

export default function WhySapJobFinderPage() {
  return (
    <PublicLayout>
      <Navbar />

      <main className="min-h-screen">
        {/* ========================================================================= */}
        {/* 1. HERO SECTION */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-background via-surface/70 to-background pb-16 pt-28 sm:pb-20 sm:pt-36">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/15 via-accent/10 to-transparent blur-3xl"
          />

          <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles size={14} aria-hidden="true" />
              <span>Dedicated SAP Career Platform</span>
            </div>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-text sm:text-5xl sm:leading-[1.15] lg:text-6xl">
              Built for the <span className="text-primary">SAP Career Journey</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg sm:leading-relaxed">
              SAP Jobs Finder is a focused ecosystem connecting SAP professionals, employers,
              opportunities, and the community. We simplify discovery, career progression, and
              talent acquisition without generic job board noise.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/jobs"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary px-7 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 sm:w-auto"
              >
                <span>Explore SAP Jobs</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>

              <Link
                href="/talent-hub"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-border bg-card px-7 text-sm font-semibold text-text shadow-soft transition hover:border-primary/40 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 sm:w-auto"
              >
                <Users size={16} className="text-primary" aria-hidden="true" />
                <span>Find SAP Talent</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. OUR MISSION */}
        {/* ========================================================================= */}
        <section
          id="mission"
          className="scroll-mt-28 border-b border-border/60 bg-surface/50 py-16 sm:py-24"
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <Target size={14} aria-hidden="true" />
                <span>Our Mission</span>
              </div>

              <h2 className="mt-4 text-2xl font-bold tracking-tight text-text sm:text-3xl lg:text-4xl">
                Focused on Advancing the SAP Ecosystem
              </h2>

              <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
                Generic job platforms are noisy, fragmented, and lack understanding of SAP
                specializations. Our mission is to build a structured, transparent platform centered
                entirely around SAP careers — making discovery effortless for professionals and
                helping employers connect with verified expertise.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {missionPillars.map((pillar) => {
                const IconComponent = pillar.icon;
                return (
                  <div
                    key={pillar.title}
                    className="flex flex-col rounded-[var(--radius-card)] border border-border/80 bg-card p-6 shadow-soft transition hover:border-primary/30 hover:shadow-lift"
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

        {/* ========================================================================= */}
        {/* 3. ABOUT SAP JOBS FINDER */}
        {/* ========================================================================= */}
        <section id="about" className="scroll-mt-28 border-b border-border/60 bg-background py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <Layers size={14} aria-hidden="true" />
                <span>About SAP Jobs Finder</span>
              </div>

              <h2 className="mt-4 text-2xl font-bold tracking-tight text-text sm:text-3xl lg:text-4xl">
                A Unified Platform for SAP Professionals & Employers
              </h2>

              <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
                SAP Jobs Finder brings together four vital pillars of the SAP career journey into one
                coherent, specialized environment.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {platformPillars.map((pillar) => {
                const IconComponent = pillar.icon;
                return (
                  <article
                    key={pillar.title}
                    className="flex flex-col justify-between rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft transition hover:border-primary/30 hover:shadow-lift sm:p-8"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                          <IconComponent size={22} aria-hidden="true" />
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                            pillar.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                          }`}
                        >
                          {pillar.status}
                        </span>
                      </div>

                      <h3 className="mt-5 text-xl font-bold text-text">{pillar.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{pillar.description}</p>

                      <ul className="mt-5 space-y-2 border-t border-border/60 pt-4">
                        {pillar.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2.5 text-xs sm:text-sm text-text/90">
                            <CheckCircle2 size={15} className="shrink-0 text-primary" aria-hidden="true" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 pt-4">
                      <Link
                        href={pillar.href}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-accent"
                      >
                        <span>{pillar.cta}</span>
                        <ArrowRight size={14} aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. WHY SAP JOBS FINDER? */}
        {/* ========================================================================= */}
        <section
          id="why-sap-job-finder"
          className="scroll-mt-28 border-b border-border/60 bg-surface/50 py-16 sm:py-24"
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <CheckCircle2 size={14} aria-hidden="true" />
                <span>Value Proposition</span>
              </div>

              <h2 className="mt-4 text-2xl font-bold tracking-tight text-text sm:text-3xl lg:text-4xl">
                Why SAP Jobs Finder?
              </h2>

              <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
                Built specifically to solve the distinct challenges of SAP hiring, career transitions,
                and talent discovery.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {benefitCards.map((benefit) => {
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

        {/* ========================================================================= */}
        {/* 5. FOR SAP PROFESSIONALS */}
        {/* ========================================================================= */}
        <section
          id="professionals"
          className="scroll-mt-28 border-b border-border/60 bg-background py-16 sm:py-24"
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  <GraduationCap size={14} aria-hidden="true" />
                  <span>For Candidates</span>
                </div>

                <h2 className="mt-4 text-2xl font-bold tracking-tight text-text sm:text-3xl lg:text-4xl">
                  For SAP Professionals
                </h2>

                <p className="mt-2 text-lg font-medium text-primary sm:text-xl">
                  Your SAP career is more than a job search.
                </p>

                <p className="mt-4 text-base leading-relaxed text-muted">
                  Whether you are an experienced Functional Consultant, Technical ABAP/BTP Developer,
                  Solution Architect, or Project Lead, SAP Jobs Finder helps you navigate opportunities
                  and showcase your expertise on your terms.
                </p>

                <ul className="mt-6 space-y-3">
                  {[
                    "Discover verified SAP jobs filtered by module, sub-module, and seniority",
                    "Build your SAP professional profile and showcase module competencies",
                    "Choose whether to make your profile discoverable to employers in Talent Hub",
                    "Connect with the SAP Community to exchange interview tips and insights",
                    "Access career resources and interview preparation tools as they become available",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-text">
                      <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
                  <Link
                    href="/jobs"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition hover:bg-primary/90"
                  >
                    <span>Explore SAP Jobs</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>

                  <Link
                    href="/talent-hub"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] border border-border bg-surface px-6 py-3 text-sm font-semibold text-text hover:bg-card hover:border-primary/40 transition"
                  >
                    <span>Explore Talent Hub</span>
                  </Link>
                </div>
              </div>

              {/* Right Side Visual Highlight Box */}
              <div className="lg:col-span-5">
                <div className="rounded-[var(--radius-card)] border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-soft sm:p-8">
                  <h3 className="text-base font-bold text-text">Popular SAP Specializations</h3>
                  <p className="mt-1 text-xs text-muted">
                    Discover roles and connect across key enterprise domains:
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      "SAP FICO",
                      "SAP MM",
                      "SAP SD",
                      "SAP ABAP",
                      "SAP BTP",
                      "SAP S/4HANA",
                      "SAP SuccessFactors",
                      "SAP Basis",
                      "SAP PP",
                      "SAP EWM",
                      "SAP Ariba",
                      "SAP CPI / Integration",
                    ].map((mod) => (
                      <Link
                        key={mod}
                        href={`/jobs?module=${encodeURIComponent(mod)}`}
                        className="rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs font-medium text-text transition hover:border-primary/50 hover:text-primary"
                      >
                        {mod}
                      </Link>
                    ))}
                  </div>

                  <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs leading-relaxed text-muted">
                    <span className="font-semibold text-text">Privacy First:</span> You retain full
                    control over your Talent Hub visibility. Keep your profile private or open for
                    direct recruiter outreach.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. FOR EMPLOYERS */}
        {/* ========================================================================= */}
        <section
          id="employers"
          className="scroll-mt-28 border-b border-border/60 bg-surface/50 py-16 sm:py-24"
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 items-center">
              {/* Left Side Feature Card */}
              <div className="order-2 lg:order-1 lg:col-span-5">
                <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft sm:p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Building2 size={24} aria-hidden="true" />
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-text">Targeted SAP Hiring</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    Stop sifting through hundreds of irrelevant applicants. Reach professionals
                    with verified hands-on module expertise.
                  </p>

                  <div className="mt-6 space-y-3 border-t border-border/60 pt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Target Audience</span>
                      <span className="font-semibold text-text">100% SAP Ecosystem</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Talent Discovery</span>
                      <span className="font-semibold text-text">Module & Skill Filtered</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Job Posting</span>
                      <span className="font-semibold text-text">Immediate Visibility</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side Content */}
              <div className="order-1 lg:order-2 lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Building2 size={14} aria-hidden="true" />
                  <span>For Employers</span>
                </div>

                <h2 className="mt-4 text-2xl font-bold tracking-tight text-text sm:text-3xl lg:text-4xl">
                  For Employers & Hiring Teams
                </h2>

                <p className="mt-2 text-lg font-medium text-primary sm:text-xl">
                  Hire Specialized SAP Talent with Confidence
                </p>

                <p className="mt-4 text-base leading-relaxed text-muted">
                  Finding qualified SAP consultants and architects for complex implementations requires
                  precision. SAP Jobs Finder provides dedicated recruiting tools and direct talent
                  search built specifically for SAP hiring needs.
                </p>

                <ul className="mt-6 space-y-3">
                  {[
                    "Post SAP openings directly to an active community of SAP specialists",
                    "Discover qualified professionals through the searchable Talent Hub",
                    "Filter candidates by SAP module, years of experience, and availability",
                    "Reduce time-to-hire by bypassing generic candidate noise",
                    "Build a sustainable talent pipeline for ongoing and upcoming project cycles",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-text">
                      <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
                  <Link
                    href="/employer/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition hover:bg-primary/90"
                  >
                    <span>Post a Job</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>

                  <Link
                    href="/talent-hub"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] border border-border bg-surface px-6 py-3 text-sm font-semibold text-text hover:bg-card hover:border-primary/40 transition"
                  >
                    <span>Find SAP Talent</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. CONTACT US */}
        {/* ========================================================================= */}
        <section id="contact" className="scroll-mt-28 bg-background py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <MessageSquare size={14} aria-hidden="true" />
                <span>Get in Touch</span>
              </div>

              <h2 className="mt-4 text-2xl font-bold tracking-tight text-text sm:text-3xl lg:text-4xl">
                Let&apos;s Connect
              </h2>

              <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
                Have a question, suggestion, partnership idea, or need help with SAP Jobs Finder?
                We&apos;d love to hear from you.
              </p>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:gap-10 items-start">
              {/* Main Contact Form */}
              <div className="lg:col-span-7">
                <ContactForm />
              </div>

              {/* Contact Details & FAQs */}
              <div className="lg:col-span-5">
                <ContactInfoCard />
              </div>
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
