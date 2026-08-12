"use client";

import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type ReadinessItem = {
  id: string;
  label: string;
  complete: boolean;
};

export function ApplicationReadinessCard({
  items,
}: {
  items: ReadinessItem[];
}) {
  const done = items.filter((item) => item.complete).length;
  const percent = Math.round((done / items.length) * 100);
  const ready = percent >= 80;

  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft sm:p-6">
      <h3 className="text-sm font-semibold text-text">Application Readiness</h3>
      <p className="mt-1 text-sm font-medium text-primary">
        {ready ? "You're ready to apply!" : "Almost ready to apply"}
      </p>

      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-sm">
            {item.complete ? (
              <Check size={16} className="text-success" aria-hidden="true" />
            ) : (
              <Circle size={16} className="text-muted" aria-hidden="true" />
            )}
            <span className={item.complete ? "text-text" : "text-muted"}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-muted">Application readiness</span>
          <span className="font-semibold text-primary">{percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <Button
        href="/candidate/jobs"
        variant="primary"
        className="mt-5 !px-4 !py-2.5 text-sm"
      >
        Browse SAP Jobs
      </Button>
    </section>
  );
}

export function ProfileStrengthCard({
  profileCompletion,
  items,
}: {
  profileCompletion: number;
  items: ReadinessItem[];
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft sm:p-6">
      <h3 className="text-sm font-semibold text-text">
        Make your profile stronger
      </h3>
      <p className="mt-1 text-sm text-muted">
        Your resume and SAP profile work together to improve your job
        recommendations and make applications faster.
      </p>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted">Profile Completion</span>
        <span className="font-semibold text-primary">{profileCompletion}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          style={{ width: `${profileCompletion}%` }}
        />
      </div>

      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted">{item.label}</span>
            <span className={item.complete ? "text-success" : "text-muted"}>
              {item.complete ? "✓" : "○"}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href="/candidate/profile"
        className="mt-4 inline-flex text-sm font-semibold text-primary hover:text-accent"
      >
        Open My Profile
      </Link>
    </section>
  );
}
