import Link from "next/link";
import { ArrowRight, Building2, Lock, ShieldCheck, Sparkles, UserCheck } from "lucide-react";

export function EmployerConversionBanner() {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-soft sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-2xl"
      />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Building2 size={13} aria-hidden="true" />
            <span>Employer Access</span>
          </div>

          <h2 className="mt-3 text-xl font-bold tracking-tight text-text sm:text-2xl">
            Looking for SAP talent?
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
            Sign in as an employer to view complete candidate profiles, verified resumes, full
            employment histories, and connect directly with specialized SAP professionals.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-primary" aria-hidden="true" />
              <span>Full Work Histories</span>
            </div>
            <div className="flex items-center gap-1.5">
              <UserCheck size={14} className="text-primary" aria-hidden="true" />
              <span>Direct Candidate Outreach</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock size={14} className="text-primary" aria-hidden="true" />
              <span>Verified SAP Credentials</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
          <Link
            href="/employer/login"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary px-6 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 text-center"
          >
            <span>Sign in as Employer</span>
            <ArrowRight size={15} aria-hidden="true" />
          </Link>

          <Link
            href="/employer/register"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-border bg-card px-6 text-sm font-semibold text-text shadow-soft transition hover:border-primary/40 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 text-center"
          >
            <span>Create Employer Account</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
