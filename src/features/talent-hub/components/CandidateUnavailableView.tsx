import Link from "next/link";
import { ArrowLeft, Lock, ShieldAlert } from "lucide-react";

type CandidateUnavailableViewProps = {
  title?: string;
  message?: string;
};

export function CandidateUnavailableView({
  title = "Candidate Profile Unavailable",
  message = "This candidate has chosen to keep their profile private or is not currently discoverable in Talent Hub.",
}: CandidateUnavailableViewProps) {
  return (
    <div className="mx-auto max-w-2xl py-12">
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-8 text-center shadow-soft sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/15 text-muted border border-border">
          <Lock size={24} aria-hidden="true" />
        </div>

        <h1 className="mt-4 text-xl font-bold text-text sm:text-2xl">{title}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          {message}
        </p>

        <div className="mt-6 flex justify-center">
          <Link
            href="/talent-hub/search"
            className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-button)] bg-primary px-6 text-xs font-semibold text-white shadow-xs transition hover:bg-primary/90"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            <span>Back to Talent Search</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
