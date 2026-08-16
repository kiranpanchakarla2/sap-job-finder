"use client";

import { Clock, Globe2, HelpCircle, Mail, MessageSquareText, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/lib/constants";

export function ContactInfoCard() {
  return (
    <div className="flex flex-col gap-6">
      {/* Primary Info Card */}
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft sm:p-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MessageSquareText size={24} aria-hidden="true" />
        </div>

        <h2 className="mt-4 text-xl font-bold tracking-tight text-text sm:text-2xl">
          Get in Touch
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Whether you have questions about SAP job listings, hiring solutions, account management,
          or partnership opportunities, our dedicated team is here to assist you.
        </p>

        <div className="mt-6 space-y-4 border-t border-border pt-6 text-sm">
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface text-primary border border-border">
              <Mail size={16} aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-text">Direct Email Support</p>
              <a
                href={`mailto:${siteConfig.supportEmail || "support@sapjobsfinder.com"}`}
                className="text-primary hover:text-accent transition-colors underline-offset-2 hover:underline"
              >
                {siteConfig.supportEmail || "support@sapjobsfinder.com"}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface text-primary border border-border">
              <Clock size={16} aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-text">Support Hours & SLA</p>
              <p className="text-muted">Monday – Friday, 9:00 AM – 6:00 PM IST</p>
              <p className="text-xs text-muted-text/80 mt-0.5">
                We typically respond within 24–48 business hours.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface text-primary border border-border">
              <Globe2 size={16} aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-text">Ecosystem Coverage</p>
              <p className="text-muted">
                India, APAC, EMEA & North American SAP hiring markets.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Privacy Commitment Banner */}
      <div className="rounded-[var(--radius-card)] border border-border/80 bg-surface p-5 text-xs text-muted flex items-start gap-3">
        <ShieldCheck size={20} className="shrink-0 text-emerald-500 mt-0.5" aria-hidden="true" />
        <p className="leading-relaxed">
          <strong className="font-semibold text-text">Privacy Protected:</strong> Your information
          is encrypted and securely handled. We never share or sell your contact details to third
          parties.
        </p>
      </div>

      {/* FAQ Quick Assistance */}
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center gap-2 text-text font-semibold text-sm">
          <HelpCircle size={16} className="text-primary" aria-hidden="true" />
          <span>Frequently Asked Inquiries</span>
        </div>
        <ul className="mt-4 space-y-3 text-xs text-muted leading-relaxed">
          <li>
            <strong className="text-text">Candidates:</strong> Having trouble applying? Include the
            Job Title or ID and relevant details in your message.
          </li>
          <li>
            <strong className="text-text">Employers:</strong> Inquiries about bulk job imports or
            talent search plans will be routed to our enterprise team.
          </li>
          <li>
            <strong className="text-text">Technical Issues:</strong> You may attach screenshots or
            logs (up to 10 MB) directly to your request.
          </li>
        </ul>
      </div>
    </div>
  );
}
