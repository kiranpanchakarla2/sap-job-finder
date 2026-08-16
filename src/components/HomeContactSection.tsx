import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Headphones,
  HelpCircle,
  Mail,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { siteConfig } from "@/lib/constants";

export function HomeContactSection() {
  return (
    <section className="relative overflow-hidden border-t border-border/60 bg-gradient-to-b from-surface via-card to-surface py-16 sm:py-20">
      {/* Decorative ambient background blur */}
      <div
        className="pointer-events-none absolute -left-20 top-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-20 top-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-accent/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="rounded-[var(--radius-card)] border border-border/80 bg-gradient-to-br from-card via-surface to-card p-8 sm:p-12 lg:p-14 shadow-lift">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
              {/* Left Column: Heading & Copy (7 cols) */}
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  <Headphones size={14} aria-hidden="true" />
                  <span>Support & Inquiries</span>
                </div>

                <h2 className="mt-4 font-heading text-2xl font-extrabold tracking-tight text-text sm:text-3xl lg:text-4xl">
                  Have Questions or Need Assistance?
                </h2>

                <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                  Whether you&apos;re an SAP specialist exploring new career opportunities, an employer
                  building an enterprise team, or have questions about the platform — our team is ready to help.
                </p>

                {/* Quick Topic Badges */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-start gap-2.5 rounded-xl border border-border bg-surface/80 p-3">
                    <Briefcase size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-bold text-text">Job Seekers</p>
                      <p className="text-[11px] text-muted">Applications & CV help</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl border border-border bg-surface/80 p-3">
                    <Building2 size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-bold text-text">Employers</p>
                      <p className="text-[11px] text-muted">Postings & talent search</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl border border-border bg-surface/80 p-3">
                    <Sparkles size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                    <div>
                      <p className="text-xs font-bold text-text">General & Media</p>
                      <p className="text-[11px] text-muted">Partnership inquiries</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive CTA Box (5 cols) */}
              <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center">
                <div className="w-full max-w-sm rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-7 text-center lg:text-left shadow-soft">
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-primary font-bold text-sm">
                    <MessageSquare size={18} aria-hidden="true" />
                    <span>Get in Touch Directly</span>
                  </div>

                  <p className="mt-2 text-xs text-muted leading-relaxed">
                    Submit a message through our secure contact center. No account is required for general inquiries.
                  </p>

                  <div className="mt-6 flex flex-col gap-3">
                    <Link
                      href="/contact"
                      className="group inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-button)] transition-all hover:bg-primary/90 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    >
                      <span>Contact Us</span>
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </Link>

                    <div className="flex items-center justify-center lg:justify-start gap-2 text-[11px] text-muted pt-1">
                      <Mail size={12} aria-hidden="true" />
                      <span>Email:</span>
                      <a
                        href={`mailto:${siteConfig.supportEmail}`}
                        className="font-medium text-text hover:text-primary transition-colors underline"
                      >
                        {siteConfig.supportEmail}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
