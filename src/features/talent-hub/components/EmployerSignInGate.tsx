"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, Lock, ShieldCheck, UserCheck } from "lucide-react";

type EmployerSignInGateProps = {
  candidateId: string;
};

export function EmployerSignInGate({ candidateId }: EmployerSignInGateProps) {
  const loginUrl = `/employer/login?next=${encodeURIComponent(`/talent-hub/candidate/${candidateId}`)}`;

  return (
    <div className="mx-auto max-w-2xl py-12">
      <div className="rounded-[var(--radius-card)] border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-8 text-center shadow-soft sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
          <Lock size={28} aria-hidden="true" />
        </div>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          <Building2 size={13} aria-hidden="true" />
          <span>Employer Authorization Required</span>
        </div>

        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-text sm:text-3xl">
          Employer sign-in required
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          Sign in as an employer to view complete SAP talent profiles, full work histories,
          verified credentials, and connect directly with specialized professionals.
        </p>

        {/* Protected items checklist */}
        <div className="mx-auto mt-6 max-w-sm rounded-xl border border-border/80 bg-surface/50 p-4 text-left text-xs space-y-2.5 text-muted">
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-primary shrink-0" aria-hidden="true" />
            <span>Complete verified candidate identity & name</span>
          </div>
          <div className="flex items-center gap-2">
            <UserCheck size={15} className="text-primary shrink-0" aria-hidden="true" />
            <span>In-depth SAP implementation & project history</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 size={15} className="text-primary shrink-0" aria-hidden="true" />
            <span>Direct employer outreach & resume access</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={loginUrl}
            className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary px-7 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition hover:bg-primary/90"
          >
            <span>Employer Sign In</span>
            <ArrowRight size={15} aria-hidden="true" />
          </Link>

          <Link
            href="/talent-hub/search"
            className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-[var(--radius-button)] border border-border bg-card px-6 text-sm font-semibold text-text shadow-soft hover:bg-surface transition"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            <span>Browse Public Talent Hub</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
