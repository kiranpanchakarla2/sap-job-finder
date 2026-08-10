"use client";

import type { ReactNode } from "react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { OnboardingProgress, OnboardingStepIndicator } from "./OnboardingProgress";
import { ONBOARDING_STEPS } from "../constants";

export function OnboardingLayout({
  currentStep,
  children,
}: {
  currentStep: number;
  children: ReactNode;
}) {
  const step = ONBOARDING_STEPS[currentStep - 1];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <BrandLogo href="/employer/onboarding" />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:py-12">
        <aside className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Company setup
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-text">
              Set up your company
            </h1>
            <p className="mt-2 text-sm text-muted">
              Complete a short guided setup so candidates can learn about your organization.
            </p>
          </div>

          <div className="hidden lg:block">
            <OnboardingProgress currentStep={currentStep} />
          </div>

          <div className="rounded-[var(--radius-card)] border border-border bg-card p-4 lg:hidden">
            <OnboardingStepIndicator currentStep={currentStep} />
            <p className="mt-1 text-sm font-semibold text-text">{step?.title}</p>
            <div className="mt-3 flex gap-2" aria-hidden="true">
              {ONBOARDING_STEPS.map((item) => (
                <span
                  key={item.id}
                  className={`h-1.5 flex-1 rounded-full ${
                    item.id <= currentStep ? "bg-primary" : "bg-border"
                  }`}
                />
              ))}
            </div>
          </div>
        </aside>

        <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft sm:p-8">
          <div className="mb-6 hidden lg:block">
            <OnboardingStepIndicator currentStep={currentStep} />
            <h2 className="mt-1 text-xl font-semibold text-text">{step?.title}</h2>
            <p className="mt-1 text-sm text-muted">{step?.description}</p>
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}
