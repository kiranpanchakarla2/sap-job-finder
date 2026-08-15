"use client";

import { Award, CheckCircle, Flame, Rocket, Search, ShieldCheck, Zap } from "lucide-react";

export function BenefitsSection() {
  return (
    <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Professional Benefit Card */}
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Zap size={18} aria-hidden="true" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Best for Active Seekers
            </span>
            <h3 className="text-lg font-bold tracking-tight text-text">
              Why choose Professional?
            </h3>
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-muted">
          Designed for SAP professionals actively looking for new opportunities who need higher capacity and smart optimization tools.
        </p>

        <ul className="mt-4 space-y-3">
          <li className="flex items-start gap-2.5 text-xs text-text">
            <CheckCircle size={15} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
            <span>
              <strong>5x Application Capacity:</strong> Apply to up to 25 roles each month across leading SAP consulting and enterprise firms.
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-xs text-text">
            <CheckCircle size={15} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
            <span>
              <strong>ATS Resume Scoring:</strong> Identify keyword gaps and optimize your profile before submitting.
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-xs text-text">
            <CheckCircle size={15} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
            <span>
              <strong>20 Active Job Alerts:</strong> Get instant notifications the moment matching SAP modules or certifications are posted.
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-xs text-text">
            <CheckCircle size={15} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
            <span>
              <strong>Enhanced Application Tracking:</strong> See status updates and timeline milestones for your submissions.
            </span>
          </li>
        </ul>
      </div>

      {/* Premium Benefit Card */}
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Rocket size={18} aria-hidden="true" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
              Maximum Impact
            </span>
            <h3 className="text-lg font-bold tracking-tight text-text">
              Why choose Premium?
            </h3>
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-muted">
          For candidates who want maximum visibility to SAP employers, unlimited application volume, and priority profile placement.
        </p>

        <ul className="mt-4 space-y-3">
          <li className="flex items-start gap-2.5 text-xs text-text">
            <CheckCircle size={15} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
            <span>
              <strong>Unlimited Job Applications:</strong> No monthly caps on job applications, saved jobs, or alerts.
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-xs text-text">
            <CheckCircle size={15} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
            <span>
              <strong>Priority Talent Search Placement:</strong> Appear at the top when employers search for your SAP skills and certifications.
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-xs text-text">
            <CheckCircle size={15} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
            <span>
              <strong>Multi-Resume Management:</strong> Maintain tailored resumes for different SAP modules (e.g. FICO vs S/4HANA Finance).
            </span>
          </li>
          <li className="flex items-start gap-2.5 text-xs text-text">
            <CheckCircle size={15} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
            <span>
              <strong>Direct Recruiter Reach:</strong> Fast-track communication channel for direct employer recruiter messages.
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
