import { CalendarClock, CheckCircle2, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  careerCounsellingExperts,
  careerCounsellingTopics,
} from "@/lib/services-nav";

const sessionOptions = [
  {
    duration: "30 minutes",
    label: "Quick guidance",
    description: "Focused advice on one career decision or interview prep topic.",
  },
  {
    duration: "60 minutes",
    label: "Deep dive",
    description: "Full career roadmap, module switch planning, or salary strategy.",
  },
] as const;

export function CareerCounsellingContent() {
  return (
    <div className="space-y-10">
      <section className="grid gap-4 sm:grid-cols-2">
        {sessionOptions.map((option) => (
          <article
            key={option.duration}
            className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft"
          >
            <div className="flex items-center gap-2 text-primary">
              <CalendarClock size={20} aria-hidden />
              <span className="text-sm font-semibold uppercase tracking-wide">
                {option.duration}
              </span>
            </div>
            <h2 className="mt-3 text-xl font-bold text-text">{option.label}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{option.description}</p>
          </article>
        ))}
      </section>

      <section>
        <div className="flex items-center gap-2">
          <Users size={20} className="text-primary" aria-hidden />
          <h2 className="text-xl font-bold text-text">Talk to experts like</h2>
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {careerCounsellingExperts.map((expert) => (
            <li
              key={expert}
              className="rounded-[var(--radius-control)] border border-border bg-surface/60 px-4 py-3 text-sm font-medium text-text"
            >
              {expert}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-text">They can help with</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {careerCounsellingTopics.map((topic) => (
            <li key={topic} className="flex items-start gap-2.5 text-sm text-muted">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" aria-hidden />
              <span>{topic}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[var(--radius-card)] border border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card p-6 sm:p-8">
        <h2 className="text-xl font-bold text-text">Ready to book a session?</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Create your candidate profile to schedule career counselling with SAP practitioners
          who understand your module, market, and goals.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/signup">Book a session</Button>
          <Button href="/signin" variant="secondary">
            Sign in to continue
          </Button>
        </div>
      </section>
    </div>
  );
}
