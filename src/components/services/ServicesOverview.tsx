import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ContactUsSection } from "@/components/services/ContactUsSection";
import {
  getFeatureHref,
  serviceSectionDetails,
  servicesOverviewIntro,
} from "@/lib/services-content";

export function ServicesOverview() {
  return (
    <div className="space-y-20 sm:space-y-24">
      {serviceSectionDetails.map((section, sectionIndex) => {
        const Icon = section.icon;
        return (
          <Reveal key={section.id} delay={sectionIndex * 0.04}>
            <section
              id={section.id}
              className="scroll-mt-28 border-t border-border/60 pt-16 first:border-t-0 first:pt-0 sm:pt-20"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                    <Icon size={14} aria-hidden />
                    {section.label}
                  </div>
                  <h2 className="mt-4 text-2xl font-bold tracking-tight text-text sm:text-3xl">
                    {section.label}
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-muted">
                    {section.overview}
                  </p>
                </div>
                <ul className="mt-2 flex flex-col gap-2 lg:mt-8 lg:min-w-[240px]">
                  {section.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted">
                      <CheckCircle2
                        size={16}
                        className="mt-0.5 shrink-0 text-success"
                        aria-hidden
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10 grid gap-5 md:grid-cols-2">
                {section.features.map((feature) => (
                  <article
                    key={feature.slug}
                    className="flex h-full flex-col rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft transition hover:border-primary/20 hover:shadow-lift sm:p-6"
                  >
                    <h3 className="text-lg font-bold text-text">{feature.label}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {feature.summary}
                    </p>
                    <ul className="mt-4 flex-1 space-y-2">
                      {feature.details.map((detail) => (
                        <li
                          key={detail}
                          className="flex items-start gap-2 text-sm text-muted"
                        >
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={getFeatureHref(section.id, feature.slug)}
                      className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary transition hover:opacity-80"
                    >
                      Explore {feature.label}
                      <ArrowRight size={14} aria-hidden />
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          </Reveal>
        );
      })}

      <Reveal>
        <ContactUsSection />
      </Reveal>
    </div>
  );
}

export function ServicesHero() {
  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-border/70 bg-gradient-to-br from-primary/10 via-card to-card p-8 sm:p-10 lg:p-12">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Services
        </p>
        <h1 className="mt-3 max-w-3xl font-heading text-3xl font-bold tracking-tight text-text sm:text-4xl lg:text-5xl">
          {servicesOverviewIntro.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          {servicesOverviewIntro.subtitle}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="#career-services">Explore Career Services</Button>
          <Button href="#contact" variant="secondary">
            Contact us
          </Button>
        </div>

        <nav
          className="mt-10 flex flex-wrap gap-2"
          aria-label="Jump to service sections"
        >
          {serviceSectionDetails.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-muted transition hover:border-primary/30 hover:text-primary"
            >
              {section.label}
            </a>
          ))}
        </nav>
      </div>
    </Reveal>
  );
}
