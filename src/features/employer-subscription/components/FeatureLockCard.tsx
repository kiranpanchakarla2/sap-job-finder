"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EMPLOYER_SUBSCRIPTION_ROUTES } from "../config/routes";

export function FeatureLockCard({
  title,
  description,
  upgradeLabel = "Upgrade to Pro",
  upgradeHref = EMPLOYER_SUBSCRIPTION_ROUTES.subscription,
  className = "",
}: {
  title: string;
  description: string;
  upgradeLabel?: string;
  upgradeHref?: string;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft sm:p-8 ${className}`}
    >
      <div className="mx-auto flex max-w-lg flex-col items-center text-center">
        <div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <Lock size={22} />
        </div>
        <h2 className="text-lg font-semibold text-text">{title}</h2>
        <p className="mt-2 text-sm text-muted">{description}</p>
        <div className="mt-5">
          <Button href={upgradeHref}>{upgradeLabel}</Button>
        </div>
      </div>
    </section>
  );
}
