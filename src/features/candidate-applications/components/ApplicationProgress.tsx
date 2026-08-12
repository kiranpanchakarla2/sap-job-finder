"use client";

import { APPLICATION_STEPS } from "../constants";
import type { ApplicationStepId } from "../types/application.types";

export function ApplicationProgress({ currentStep }: { currentStep: ApplicationStepId }) {
  const currentIndex = APPLICATION_STEPS.findIndex((step) => step.id === currentStep);

  return (
    <nav aria-label="Application progress" className="w-full">
      <ol className="flex flex-wrap items-center gap-2">
        {APPLICATION_STEPS.map((step, index) => {
          const active = index === currentIndex;
          const done = index < currentIndex;
          return (
            <li key={step.id} className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? "bg-primary text-white"
                    : done
                      ? "bg-primary/10 text-primary"
                      : "bg-surface text-muted"
                }`}
                aria-current={active ? "step" : undefined}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">
                  {index + 1}
                </span>
                <span className="hidden sm:inline">{step.shortLabel}</span>
              </span>
              {index < APPLICATION_STEPS.length - 1 ? (
                <span className="hidden text-muted sm:inline" aria-hidden="true">
                  →
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
