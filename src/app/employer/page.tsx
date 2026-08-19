import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  Database,
  FileSpreadsheet,
  Globe,
  GraduationCap,
  Layers,
  Lock,
  MessageSquare,
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
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Employer Portal | Hire Specialized SAP Talent | SAP Jobs Finder",
  description:
    "Post SAP job openings, discover pre-vetted consultants, developers, and architects, and streamline your SAP recruitment workflow.",
  openGraph: {
    title: "Employer Portal | Hire Specialized SAP Talent | SAP Jobs Finder",
    description:
      "Post SAP job openings, discover pre-vetted consultants, developers, and architects, and streamline your SAP recruitment workflow.",
    type: "website",
  },
};

const employerFeatures = [
  {
    icon: Search,
    title: "Specialized SAP Talent Discovery",
    description:
      "Search and filter verified SAP professionals by module expertise (FICO, MM, SD, ABAP, BTP), years of implementation experience, and availability.",
  },
  {
    icon: FileSpreadsheet,
    title: "Single & Bulk Job Uploads",
    description:
      "Publish individual SAP openings or import dozens of roles at once using structured Excel templates with instant validation.",
  },
  {
    icon: Layers,
    title: "Visual Applicant Tracking Pipeline",
    description:
      "Manage incoming candidates across custom hiring stages — Screened, Technical Interview, Offer, and Hired — in one unified dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Implementation Track Records",
    description:
      "Review candidates' real SAP project histories, official certifications, clean core competencies, and permitted resumes with candidate-governed privacy.",
  },
  {
    icon: BarChart3,
    title: "Recruitment Analytics & Insights",
    description:
      "Track job view metrics, application velocity, and pipeline conversion rates to optimize your SAP talent acquisition strategy.",
  },
  {
    icon: Users,
    title: "Team Collaboration & Role Permissions",
    description:
      "Invite your hiring managers and recruitment team with granular role controls (Owner, Admin, Recruiter) to streamline candidate evaluation.",
  },
];

const hiringSteps = [
  {
    step: "01",
    title: "Create Your Employer Account",
    description:
      "Register your organization in under 2 minutes and set up your branded company profile.",
  },
  {
    step: "02",
    title: "Post SAP Roles or Search Talent",
    description:
      "Publish targeted job postings or browse the Talent Hub to discover active SAP consultants and architects.",
  },
  {
    step: "03",
    title: "Evaluate & Shortlist Candidates",
    description:
      "Review structured module competencies, implementation track records, and download verified candidate resumes.",
  },
  {
    step: "04",
    title: "Connect & Hire",
    description:
      "Express interest, schedule interviews, and build your high-impact SAP delivery team faster than ever.",
  },
];

const sapPracticeAreas = [
  { name: "S/4HANA & ECC Core", desc: "FICO, MM, SD, PP, QM, PM" },
  { name: "SAP BTP & Clean Core", desc: "ABAP RAP/CAP, Event Mesh, UI5" },
  { name: "Supply Chain & Logistics", desc: "EWM, TM, IBP, Ariba" },
  { name: "Integration Suite", desc: "SAP CPI, API Management, PI/PO" },
  { name: "Data & Analytics", desc: "Datasphere, BW/4HANA, SAC" },
  { name: "Human Experience", desc: "SuccessFactors, Employee Central" },
  { name: "Security & Governance", desc: "GRC, Identity Management, Basis" },
  { name: "Solution Architecture", desc: "Enterprise Architecture, Cloud ALM" },
];

export default async function EmployerLandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.role === "employer" || profile?.role === "admin") {
      redirect("/employer/dashboard");
    }
  }

  return (
    <PublicLayout>
      <Navbar />

      <main className="min-h-screen bg-background pt-24 pb-20">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden px-5 py-16 sm:px-8 sm:py-24">
          {/* Subtle Ambient Background Gradients */}
          <div
            className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/15 via-accent/10 to-transparent blur-3xl"
            aria-hidden="true"
          />

          <div className="mx-auto max-w-5xl text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary shadow-xs">
              <Building2 size={14} aria-hidden="true" />
              <span>Enterprise Hiring · Specialized SAP Talent Network</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-text sm:text-5xl lg:text-6xl">
              Hire Specialized <span className="text-primary">SAP Talent</span> Faster & Smarter
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              The dedicated recruitment platform for SAP partners, enterprises, and consultancies.
              Post roles, manage applicants, and discover pre-vetted SAP consultants, developers,
              and architects across 50+ SAP modules.
            </p>

            {/* Action Buttons */}
            <div className="mt-9 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
              <Link
                href="/employer/register"
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary px-8 text-sm font-bold text-white shadow-[var(--shadow-button)] transition hover:bg-primary/90"
              >
                <span>Create Employer Account</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>

              <Link
                href="/employer/login"
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-[var(--radius-button)] border border-border bg-card px-7 text-sm font-semibold text-text shadow-soft transition hover:bg-surface hover:border-primary/40"
              >
                <span>Employer Sign In</span>
              </Link>
            </div>

            {/* Candidate Cross-link */}
            <p className="mt-6 text-xs text-muted">
              Looking for an SAP job?{" "}
              <Link
                href="/login/candidate"
                className="font-semibold text-primary hover:underline"
              >
                Candidate sign in →
              </Link>
            </p>

            {/* Key Metrics / Highlights */}
            <div className="mt-14 grid grid-cols-2 gap-4 border-t border-border/70 pt-10 sm:grid-cols-4 sm:gap-6">
              <div className="rounded-xl border border-border/60 bg-surface/40 p-4 text-center">
                <p className="text-2xl font-extrabold text-text sm:text-3xl">50,000+</p>
                <p className="mt-1 text-xs font-medium text-muted">SAP Professionals</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-surface/40 p-4 text-center">
                <p className="text-2xl font-extrabold text-primary sm:text-3xl">50+</p>
                <p className="mt-1 text-xs font-medium text-muted">SAP Modules Covered</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-surface/40 p-4 text-center">
                <p className="text-2xl font-extrabold text-text sm:text-3xl">10x</p>
                <p className="mt-1 text-xs font-medium text-muted">Faster Sourcing Velocity</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-surface/40 p-4 text-center">
                <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 sm:text-3xl">100%</p>
                <p className="mt-1 text-xs font-medium text-muted">SAP-Specific Focus</p>
              </div>
            </div>
          </div>
        </section>

        {/* CORE CAPABILITIES GRID */}
        <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Built For SAP Recruitment
            </h2>
            <p className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
              Everything you need to scale your SAP practice
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
              Say goodbye to generic job boards. Purpose-built workflows tailored specifically for the
              complexities of SAP project staffing.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {employerFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft transition hover:border-primary/40 hover:shadow-lift"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-text">{feat.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* HOW IT WORKS / 4-STEP WORKFLOW */}
        <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <div className="rounded-3xl border border-border bg-surface/50 p-8 shadow-soft sm:p-12">
            <div className="text-center">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
                Simple & Efficient
              </h2>
              <p className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
                How hiring works on SAP Jobs Finder
              </p>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {hiringSteps.map((s) => (
                <div
                  key={s.step}
                  className="relative rounded-2xl border border-border bg-card p-6 shadow-xs"
                >
                  <span className="text-xs font-extrabold text-primary">{s.step}</span>
                  <h3 className="mt-2 text-sm font-bold text-text">{s.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SAP PRACTICE AREAS SHOWCASE */}
        <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Broad Ecosystem Coverage
            </h2>
            <p className="mt-2 text-2xl font-bold tracking-tight text-text sm:text-3xl">
              Source talent across every major SAP module
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sapPracticeAreas.map((area) => (
              <div
                key={area.name}
                className="rounded-xl border border-border bg-card p-4 shadow-xs hover:border-primary/30 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <h3 className="text-xs font-bold text-text">{area.name}</h3>
                </div>
                <p className="mt-1.5 text-[11px] text-muted">{area.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* WHY SPECIALIZED SAP MATTERS / COMPARISON */}
        <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
          <div className="rounded-[var(--radius-card)] border border-border bg-card p-8 shadow-soft sm:p-10">
            <div className="text-center mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-text">
                Why Employers Choose SAP Jobs Finder Over Generic Job Boards
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-border/80 bg-surface/60 p-6 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  Generic Job Boards
                </p>
                <ul className="space-y-2.5 text-xs text-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span>Flooded with generic IT resumes without SAP context</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span>No module-specific filtering (FICO vs BTP vs EWM)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span>Unclear project lifecycle experience (Greenfield vs Support)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span>High recruiter fees with no domain specialization</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  SAP Jobs Finder
                </p>
                <ul className="space-y-2.5 text-xs text-text">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-primary shrink-0 mt-0.5" />
                    <span>100% dedicated to verified SAP professionals & consultancies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-primary shrink-0 mt-0.5" />
                    <span>Search by 50+ specific SAP modules, versions, and skills</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-primary shrink-0 mt-0.5" />
                    <span>Detailed implementation histories & verified credentials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-primary shrink-0 mt-0.5" />
                    <span>Direct candidate outreach with transparent subscriptions</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CONVERSION CTA */}
        <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-8 text-center shadow-lift sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Sparkles size={24} aria-hidden="true" />
            </div>

            <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-text sm:text-3xl lg:text-4xl">
              Ready to build your high-impact SAP team?
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Create your employer account in 60 seconds. Post specialized SAP openings, browse our
              Talent Hub, and connect with the best SAP minds in the industry.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/employer/register"
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary px-8 text-sm font-bold text-white shadow-[var(--shadow-button)] transition hover:bg-primary/90"
              >
                <span>Get Started Free</span>
                <ArrowRight size={15} aria-hidden="true" />
              </Link>

              <Link
                href="/employer/login"
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-[var(--radius-button)] border border-border bg-card px-7 text-sm font-semibold text-text shadow-soft transition hover:bg-surface"
              >
                <span>Sign In to Portal</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
