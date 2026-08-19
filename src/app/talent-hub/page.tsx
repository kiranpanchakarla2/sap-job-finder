import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Code2,
  Compass,
  Cpu,
  Eye,
  EyeOff,
  FolderGit2,
  GraduationCap,
  Layers,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PublicLayout } from "@/layouts/PublicLayout";

export const metadata: Metadata = {
  title: "Talent Hub | Discover SAP Talent | SAP Jobs Finder",
  description:
    "SAP Jobs Finder Talent Hub connects SAP professionals with employers looking for specialized SAP talent.",
  openGraph: {
    title: "Talent Hub | Discover SAP Talent | SAP Jobs Finder",
    description:
      "SAP Jobs Finder Talent Hub connects SAP professionals with employers looking for specialized SAP talent.",
    type: "website",
  },
};

const professionalSteps = [
  {
    step: "01",
    title: "Create your SAP professional profile",
    description:
      "Set up your dedicated profile highlighting your SAP domain, primary modules, and career goals.",
  },
  {
    step: "02",
    title: "Add your SAP skills and experience",
    description:
      "Detail your hands-on module competencies, project implementations, versions, and certifications.",
  },
  {
    step: "03",
    title: "Choose your profile visibility",
    description:
      "Stay in complete control by setting your visibility to public, private, or open to opportunities.",
  },
  {
    step: "04",
    title: "Become discoverable by employers",
    description:
      "Allow verified hiring managers and consulting partners to discover your module expertise directly.",
  },
  {
    step: "05",
    title: "Keep your professional profile updated",
    description:
      "Regularly update your project milestones, new certifications, and current availability status.",
  },
];

const employerSteps = [
  {
    step: "01",
    title: "Search SAP professionals",
    description:
      "Access a focused talent ecosystem tailored specifically to the enterprise SAP landscape.",
  },
  {
    step: "02",
    title: "Filter by relevant skills and experience",
    description:
      "Filter candidates by specific SAP module, sub-skills, years of experience, and location preferences.",
  },
  {
    step: "03",
    title: "Discover specialized SAP talent",
    description:
      "Identify qualified functional consultants, technical developers, and solution architects.",
  },
  {
    step: "04",
    title: "Review available talent profiles",
    description:
      "Inspect detailed profiles, verified module proficiencies, certifications, and work models.",
  },
  {
    step: "05",
    title: "Connect with relevant professionals",
    description:
      "Initiate direct conversations for permanent, contract, or advisory SAP project roles.",
  },
];

const candidateHighlights = [
  {
    icon: Layers,
    title: "SAP Modules & Sub-skills",
    description: "Highlight proficiency across S/4HANA, FICO, MM, SD, ABAP, BTP, and specialized modules.",
  },
  {
    icon: Briefcase,
    title: "Hands-on Experience",
    description: "Showcase full lifecycle rollouts, system migrations, support, and technical upgrades.",
  },
  {
    icon: GraduationCap,
    title: "SAP Certifications",
    description: "Feature official SAP credentials, specialized badges, and continuous learning achievements.",
  },
  {
    icon: Compass,
    title: "Location & Work Models",
    description: "Specify on-site, hybrid, or remote preferences alongside preferred geographic markets.",
  },
  {
    icon: Zap,
    title: "Availability & Notice",
    description: "Signal whether you are immediately available, on notice, or open to advisory projects.",
  },
  {
    icon: TrendingUp,
    title: "Career Interests",
    description: "Define desired project roles, consulting engagements, or leadership pathways.",
  },
];

const visibilityStates = [
  {
    icon: Eye,
    title: "Visible to Employers",
    tag: "Active Discovery",
    tagColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    description:
      "Your full SAP profile is searchable and discoverable by verified employers and hiring managers looking for immediate matches.",
  },
  {
    icon: Sparkles,
    title: "Open to Opportunities",
    tag: "Passive Discovery",
    tagColor: "bg-primary/10 text-primary border-primary/20",
    description:
      "Indicate that you are open to exploring select high-impact projects or leadership opportunities while keeping contact details managed.",
  },
  {
    icon: EyeOff,
    title: "Private",
    tag: "Confidential",
    tagColor: "bg-muted/15 text-muted border-border",
    description:
      "Keep your profile hidden from search results. Your profile remains your private portfolio and is only shared when you apply to roles.",
  },
];

const employerFeatures = [
  {
    icon: Search,
    title: "Search SAP Professionals",
    description: "Search specialized talent without wading through general IT applicants or irrelevant resumes.",
  },
  {
    icon: Layers,
    title: "SAP Module Filtering",
    description: "Pinpoint candidates with exact functional (FICO, MM, SD) or technical (ABAP, BTP) competence.",
  },
  {
    icon: Cpu,
    title: "Skill-Based Discovery",
    description: "Filter by specific niche skills such as RAP, CAP, CPI, Fiori, BRIM, or Datasphere.",
  },
  {
    icon: Briefcase,
    title: "Experience Filtering",
    description: "Filter by total years of SAP experience, domain expertise, and senior architectural background.",
  },
  {
    icon: Compass,
    title: "Location & Work Model",
    description: "Identify professionals matching on-site client requirements, hybrid schedules, or remote teams.",
  },
  {
    icon: ShieldCheck,
    title: "Certification Discovery",
    description: "Easily verify certified SAP practitioners who hold validated credentials in their respective areas.",
  },
];

const benefitCards = [
  {
    icon: Target,
    title: "SAP Focused",
    description:
      "Built specifically around SAP professionals, skills, modules, and careers — eliminating generic job board clutter.",
  },
  {
    icon: Users,
    title: "Specialized Talent",
    description:
      "Help employers discover professionals with deep SAP-specific expertise across implementations, upgrades, and cloud migrations.",
  },
  {
    icon: Lock,
    title: "Candidate Controlled",
    description:
      "SAP professionals have complete control over whether their profile is discoverable, open to inquiries, or kept private.",
  },
  {
    icon: Sparkles,
    title: "Better Discovery",
    description:
      "Help employers move beyond generic resume keywords and discover relevant SAP professionals by module competence and project fit.",
  },
  {
    icon: Compass,
    title: "Career Ecosystem",
    description:
      "Talent Hub is part of the wider SAP Jobs Finder ecosystem connecting jobs, talent, career growth, services, and community.",
  },
];

const talentCategories = [
  {
    title: "SAP Consultants",
    subtitle: "Functional & Implementation Specialists",
    description: "FICO, MM, SD, PP, QM, PM, HCM, and SuccessFactors consultants driving business transformations.",
    icon: Briefcase,
    type: "consultant",
  },
  {
    title: "SAP Developers",
    subtitle: "Technical & Platform Engineers",
    description: "ABAP, ABAP on HANA, RAP/CAP, Fiori/UI5, and SAP BTP developers building modern enterprise extensions.",
    icon: Code2,
    type: "developer",
  },
  {
    title: "SAP Architects",
    subtitle: "Enterprise & Solution Architects",
    description: "Strategic leaders designing S/4HANA transitions, landscape architectures, and cloud integrations.",
    icon: Cpu,
    type: "architect",
  },
  {
    title: "SAP Functional Specialists",
    subtitle: "Domain & Process Leaders",
    description: "Experts in supply chain, finance, human capital, procurement, and manufacturing workflows.",
    icon: Layers,
    type: "functional",
  },
  {
    title: "SAP Technical Specialists",
    subtitle: "Basis, Security & Integration",
    description: "Specialists in SAP Basis administration, HANA database management, CPI integrations, and security.",
    icon: ShieldCheck,
    type: "technical",
  },
  {
    title: "SAP Project & Program Leaders",
    subtitle: "Delivery & Transformation Leads",
    description: "Project managers, delivery heads, and Agile Scrum Masters managing complex SAP programs.",
    icon: FolderGit2,
    type: "program-lead",
  },
];

const guidelines = [
  {
    step: "01",
    title: "Authentic Profiles",
    description:
      "Professionals should provide accurate and verified information regarding their SAP module experience, project history, and certifications.",
  },
  {
    step: "02",
    title: "Respect Privacy",
    description:
      "Candidate visibility choices and contact preferences must always be respected by employers and recruiters across the platform.",
  },
  {
    step: "03",
    title: "Professional Communication",
    description:
      "Employers and candidates are expected to communicate transparently, respectfully, and with clear context regarding roles and requirements.",
  },
  {
    step: "04",
    title: "Relevant Opportunities",
    description:
      "Talent outreach should focus on genuine, well-defined SAP career opportunities that match the professional's skill profile and preferences.",
  },
  {
    step: "05",
    title: "Keep Profiles Current",
    description:
      "Professionals should maintain current information regarding their availability status, latest certifications, and recent implementation experience.",
  },
];

export default function TalentHubPage() {
  return (
    <PublicLayout>
      <Navbar />

      <main className="min-h-screen">
        {/* ========================================================================= */}
        {/* 1. HERO SECTION */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-background via-surface/70 to-background pb-16 pt-28 sm:pb-24 sm:pt-36">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[960px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/15 via-accent/10 to-transparent blur-3xl"
          />

          <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles size={14} aria-hidden="true" />
              <span>Two-Sided SAP Talent Marketplace</span>
            </div>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-text sm:text-5xl sm:leading-[1.15] lg:text-6xl">
              Your SAP <span className="text-primary">Talent Network</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg sm:leading-relaxed">
              Talent Hub connects SAP professionals with employers looking for specialized SAP talent.
              A focused destination built exclusively for the enterprise SAP ecosystem.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/talent-hub/search"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary px-7 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 sm:w-auto"
              >
                <span>Find SAP Talent</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>

              <Link
                href="/register/candidate"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-border bg-card px-7 text-sm font-semibold text-text shadow-soft transition hover:border-primary/40 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 sm:w-auto"
              >
                <UserCheck size={16} className="text-primary" aria-hidden="true" />
                <span>Join Talent Hub</span>
              </Link>
            </div>

            {/* Platform Feature Badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3 pt-6 border-t border-border/50 text-xs sm:text-sm text-muted">
              <div className="flex items-center gap-2 rounded-full border border-border/80 bg-card px-4 py-1.5 shadow-xs">
                <CheckCircle2 size={14} className="text-primary" aria-hidden="true" />
                <span>100% SAP Ecosystem Focus</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border/80 bg-card px-4 py-1.5 shadow-xs">
                <Lock size={14} className="text-primary" aria-hidden="true" />
                <span>Candidate-Controlled Privacy</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border/80 bg-card px-4 py-1.5 shadow-xs">
                <Layers size={14} className="text-primary" aria-hidden="true" />
                <span>Granular Module & Skill Matching</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. HOW TALENT HUB WORKS */}
        {/* ========================================================================= */}
        <section
          id="how-it-works"
          className="scroll-mt-28 border-b border-border/60 bg-surface/50 py-16 sm:py-24"
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <Compass size={14} aria-hidden="true" />
                <span>Two-Sided Platform</span>
              </div>

              <h2 className="mt-4 text-2xl font-bold tracking-tight text-text sm:text-3xl lg:text-4xl">
                How Talent Hub Works
              </h2>

              <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
                Talent Hub bridges the gap between skilled SAP practitioners and organizations seeking
                verified expertise. Explore how each journey unfolds.
              </p>
            </div>

            <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:gap-10">
              {/* Path 1: For SAP Professionals */}
              <div className="flex flex-col rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <UserCheck size={22} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text">For SAP Professionals</h3>
                    <p className="text-xs text-muted">Build visibility on your own terms</p>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  {professionalSteps.map((item) => (
                    <div
                      key={item.step}
                      className="flex gap-4 rounded-xl border border-border/60 bg-surface/40 p-4 transition hover:border-primary/30"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary border border-primary/20">
                        {item.step}
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-text">{item.title}</h4>
                        <p className="mt-1 text-xs leading-relaxed text-muted">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-4 border-t border-border/60">
                  <Link
                    href="/register/candidate"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-accent"
                  >
                    <span>Create your SAP profile</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {/* Path 2: For Employers */}
              <div className="flex flex-col rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Building2 size={22} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text">For Employers</h3>
                    <p className="text-xs text-muted">Direct discovery for specialized SAP hiring</p>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  {employerSteps.map((item) => (
                    <div
                      key={item.step}
                      className="flex gap-4 rounded-xl border border-border/60 bg-surface/40 p-4 transition hover:border-primary/30"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary border border-primary/20">
                        {item.step}
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-text">{item.title}</h4>
                        <p className="mt-1 text-xs leading-relaxed text-muted">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-4 border-t border-border/60">
                  <Link
                    href="/talent-hub/search"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-accent"
                  >
                    <span>Explore SAP talent search</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Progressive Growth Note */}
            <div className="mt-10 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center text-xs leading-relaxed text-muted sm:text-sm">
              <span className="font-semibold text-text">Growing Ecosystem:</span> Talent Hub is
              expanding progressively. As new discovery features and profile tools launch, SAP
              professionals and employers will gain deeper ways to connect directly.
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. FOR SAP PROFESSIONALS */}
        {/* ========================================================================= */}
        <section
          id="professionals"
          className="scroll-mt-28 border-b border-border/60 bg-background py-16 sm:py-24"
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <GraduationCap size={14} aria-hidden="true" />
                <span>For Candidates</span>
              </div>

              <h2 className="mt-4 text-2xl font-bold tracking-tight text-text sm:text-3xl lg:text-4xl">
                For SAP Professionals
              </h2>

              <p className="mt-2 text-lg font-semibold text-primary sm:text-xl">
                Make your SAP experience discoverable.
              </p>

              <p className="mt-4 text-base leading-relaxed text-muted">
                Build a focused, credible presence tailored exclusively to your SAP career.
                Highlight your specific module experience, certifications, and project successes to
                attract the right opportunities.
              </p>
            </div>

            {/* Highlights Grid */}
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {candidateHighlights.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex flex-col rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft transition hover:border-primary/30 hover:shadow-lift"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <IconComponent size={20} aria-hidden="true" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-text">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Profile Visibility Controls Feature Box */}
            <div className="mt-14 rounded-[var(--radius-card)] border border-border bg-surface/60 p-6 shadow-soft sm:p-10">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Lock size={12} aria-hidden="true" />
                  <span>Candidate Privacy Control</span>
                </div>
                <h3 className="mt-3 text-xl font-bold text-text sm:text-2xl">
                  You Control Your Profile Visibility
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Your privacy and career confidentiality come first. Choose exactly how visible you want
                  to be to prospective employers and recruiters at any given time.
                </p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {visibilityStates.map((state) => {
                  const IconComponent = state.icon;
                  return (
                    <div
                      key={state.title}
                      className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-xs transition hover:border-primary/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <IconComponent size={18} aria-hidden="true" />
                        </div>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${state.tagColor}`}
                        >
                          {state.tag}
                        </span>
                      </div>
                      <h4 className="mt-4 text-sm font-bold text-text">{state.title}</h4>
                      <p className="mt-2 text-xs leading-relaxed text-muted">{state.description}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/60">
                <p className="text-xs text-muted">
                  Ready to showcase your SAP profile with full privacy governance?
                </p>
                <Link
                  href="/register/candidate"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary px-6 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition hover:bg-primary/90 w-full sm:w-auto"
                >
                  <span>Join Talent Hub</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. FOR EMPLOYERS */}
        {/* ========================================================================= */}
        <section
          id="employers"
          className="scroll-mt-28 border-b border-border/60 bg-surface/50 py-16 sm:py-24"
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <Building2 size={14} aria-hidden="true" />
                <span>For Employers & Recruiters</span>
              </div>

              <h2 className="mt-4 text-2xl font-bold tracking-tight text-text sm:text-3xl lg:text-4xl">
                For Employers
              </h2>

              <p className="mt-2 text-lg font-semibold text-primary sm:text-xl">
                Find SAP talent with the skills you need.
              </p>

              <p className="mt-4 text-base leading-relaxed text-muted">
                Bypass the noise of general job boards. Talent Hub allows hiring teams and consulting
                partners to discover specialized SAP professionals based on actual module competence and
                verified experience.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {employerFeatures.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex flex-col rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft transition hover:border-primary/30 hover:shadow-lift"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <IconComponent size={20} aria-hidden="true" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-text">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 flex flex-col items-center justify-center text-center">
              <Link
                href="/talent-hub/search"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary px-8 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              >
                <span>Find SAP Talent</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. WHY TALENT HUB? */}
        {/* ========================================================================= */}
        <section
          id="why-talent-hub"
          className="scroll-mt-28 border-b border-border/60 bg-background py-16 sm:py-24"
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <Target size={14} aria-hidden="true" />
                <span>Value Proposition</span>
              </div>

              <h2 className="mt-4 text-2xl font-bold tracking-tight text-text sm:text-3xl lg:text-4xl">
                Why Talent Hub?
              </h2>

              <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
                Engineered from the ground up to solve the distinct challenges of SAP recruiting,
                consulting discovery, and career growth.
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
        {/* 6. TALENT CATEGORIES */}
        {/* ========================================================================= */}
        <section className="border-b border-border/60 bg-surface/50 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <Layers size={14} aria-hidden="true" />
                <span>Specialization Areas</span>
              </div>

              <h2 className="mt-4 text-2xl font-bold tracking-tight text-text sm:text-3xl lg:text-4xl">
                Supported SAP Talent Categories
              </h2>

              <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
                Examples of specialized roles and disciplines supported across the Talent Hub network.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {talentCategories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <div
                    key={category.title}
                    className="flex flex-col justify-between rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft transition hover:border-primary/30 hover:shadow-lift"
                  >
                    <div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                        <IconComponent size={20} aria-hidden="true" />
                      </div>
                      <h3 className="mt-4 text-base font-bold text-text">{category.title}</h3>
                      <p className="text-xs font-medium text-primary mt-0.5">{category.subtitle}</p>
                      <p className="mt-2.5 text-xs leading-relaxed text-muted">{category.description}</p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-border/60">
                      <Link
                        href={`/talent-hub/search?type=${category.type}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition hover:text-accent"
                      >
                        <span>Discover {category.title}</span>
                        <ArrowRight size={13} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. TALENT HUB GUIDELINES */}
        {/* ========================================================================= */}
        <section
          id="guidelines"
          className="scroll-mt-28 border-b border-border/60 bg-background py-16 sm:py-24"
        >
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <ShieldCheck size={14} aria-hidden="true" />
                <span>Community Standards</span>
              </div>

              <h2 className="mt-4 text-2xl font-bold tracking-tight text-text sm:text-3xl lg:text-4xl">
                Talent Hub Guidelines
              </h2>

              <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
                To maintain a trusted, high-caliber environment, all members and employers adhere to our
                core platform principles.
              </p>
            </div>

            <div className="mt-12 space-y-4 max-w-4xl mx-auto">
              {guidelines.map((guide) => (
                <div
                  key={guide.step}
                  className="flex flex-col sm:flex-row gap-4 sm:gap-6 rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft transition hover:border-primary/30"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary border border-primary/20">
                    {guide.step}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-text">{guide.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{guide.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center text-xs text-muted">
              Have questions regarding platform guidelines or data privacy?{" "}
              <Link href="/contact" className="font-semibold text-primary hover:underline">
                Contact our team
              </Link>
              .
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. FINAL DUAL CTA */}
        {/* ========================================================================= */}
        <section className="bg-surface/70 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
              {/* SAP Professionals CTA Card */}
              <div className="flex flex-col justify-between rounded-[var(--radius-card)] border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 p-8 shadow-soft sm:p-10">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    <UserCheck size={14} aria-hidden="true" />
                    <span>For SAP Professionals</span>
                  </div>

                  <h3 className="mt-5 text-2xl font-bold tracking-tight text-text sm:text-3xl">
                    Ready to build your SAP professional presence?
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                    Create your specialized profile, showcase your module competencies, and choose your
                    visibility settings to connect with employers on your terms.
                  </p>
                </div>

                <div className="mt-8">
                  <Link
                    href="/register/candidate"
                    className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary px-7 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition hover:bg-primary/90"
                  >
                    <span>Join Talent Hub</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {/* Employers CTA Card */}
              <div className="flex flex-col justify-between rounded-[var(--radius-card)] border border-border/80 bg-card p-8 shadow-soft sm:p-10">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    <Building2 size={14} aria-hidden="true" />
                    <span>For Employers</span>
                  </div>

                  <h3 className="mt-5 text-2xl font-bold tracking-tight text-text sm:text-3xl">
                    Looking for SAP talent?
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                    Discover verified consultants, architects, and developers tailored specifically to
                    your implementation requirements, modules, and project milestones.
                  </p>
                </div>

                <div className="mt-8">
                  <Link
                    href="/talent-hub/search"
                    className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-[var(--radius-button)] border border-border bg-surface px-7 text-sm font-semibold text-text shadow-soft transition hover:border-primary/40 hover:bg-card"
                  >
                    <Search size={16} className="text-primary" aria-hidden="true" />
                    <span>Find SAP Talent</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
