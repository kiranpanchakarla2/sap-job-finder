import {
  BadgeCheck,
  Search,
  Upload,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { howItWorksSteps } from "@/lib/constants";

const stepIcons: Record<(typeof howItWorksSteps)[number]["icon"], LucideIcon> = {
  UserPlus,
  Upload,
  Search,
  BadgeCheck,
};

type StepCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  step: number;
  index: number;
};

function StepCard({ title, description, icon: Icon, step, index }: StepCardProps) {
  return (
    <Reveal delay={index * 0.07} className="h-full">
      <article className="group relative flex h-full flex-col items-center rounded-[var(--radius-card)] border border-border/70 bg-card px-5 py-7 text-center shadow-soft transition duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift sm:px-6 sm:py-8">
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-bold tabular-nums text-primary">
          {String(step).padStart(2, "0")}
        </span>

        <div className="mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/15 transition group-hover:from-primary group-hover:to-accent group-hover:text-white group-hover:ring-primary/30">
          <Icon size={26} strokeWidth={1.75} aria-hidden />
        </div>

        <h3 className="mt-5 text-lg font-bold text-text sm:text-xl">{title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-[15px]">
          {description}
        </p>
      </article>
    </Reveal>
  );
}

function StepConnector({ index }: { index: number }) {
  const gradientId = `how-flow-${index}`;
  const arcUp = index % 2 === 0;
  const path = arcUp ? "M6 28 C 34 4, 46 4, 74 28" : "M6 20 C 34 44, 46 44, 74 20";

  return (
    <div
      className="hidden w-10 shrink-0 self-start pt-[5.25rem] xl:w-14 lg:flex"
      aria-hidden
    >
      <svg
        viewBox="0 0 80 48"
        className="how-it-works-connector-glow h-12 w-full overflow-visible"
        fill="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.45" />
            <stop offset="55%" stopColor="var(--primary)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="1" />
          </linearGradient>
        </defs>

        <path
          d={path}
          stroke="color-mix(in srgb, var(--primary) 18%, transparent)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        <path
          d={path}
          stroke={`url(#${gradientId})`}
          strokeWidth="2"
          strokeDasharray="7 6"
          strokeLinecap="round"
          className="how-it-works-connector-flow"
        />

        <circle cx="6" cy={arcUp ? 28 : 20} r="3.5" fill="var(--primary)" opacity="0.35" />
        <circle cx="6" cy={arcUp ? 28 : 20} r="2" fill="var(--primary)" />

        <path
          d={arcUp ? "M68 24 L76 28 L68 32 Z" : "M68 16 L76 20 L68 24 Z"}
          fill="var(--accent)"
        />

        <circle r="2.5" fill="var(--primary)">
          <animateMotion
            dur="2.4s"
            repeatCount="indefinite"
            path={path}
            className="how-it-works-connector-dot"
          />
        </circle>
      </svg>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden border-t border-border/60 bg-surface py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_60%)]" />

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Simple process
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-text sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
              How SAP Jobs Finder works
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              From sign-up to application — four clear steps to your next SAP role.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 hidden items-stretch lg:flex">
          {howItWorksSteps.map((step, index) => {
            const Icon = stepIcons[step.icon];
            return (
              <div key={step.title} className="flex min-w-0 flex-1 items-stretch">
                <StepCard
                  title={step.title}
                  description={step.description}
                  icon={Icon}
                  step={index + 1}
                  index={index}
                />
                {index < howItWorksSteps.length - 1 ? <StepConnector index={index} /> : null}
              </div>
            );
          })}
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:hidden">
          {howItWorksSteps.map((step, index) => {
            const Icon = stepIcons[step.icon];
            return (
              <StepCard
                key={step.title}
                title={step.title}
                description={step.description}
                icon={Icon}
                step={index + 1}
                index={index}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
