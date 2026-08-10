import { Check } from "lucide-react";
import { ONBOARDING_STEPS } from "../constants";

export function OnboardingProgress({ currentStep }: { currentStep: number }) {
  return (
    <ol className="space-y-4" aria-label="Onboarding progress">
      {ONBOARDING_STEPS.map((step) => {
        const complete = currentStep > step.id;
        const active = currentStep === step.id;

        return (
          <li key={step.id} className="flex gap-3">
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                complete
                  ? "bg-success text-button-fg"
                  : active
                    ? "bg-primary text-button-fg"
                    : "border border-border bg-surface text-muted"
              }`}
              aria-current={active ? "step" : undefined}
            >
              {complete ? <Check size={14} aria-hidden="true" /> : step.id}
            </span>
            <div className="min-w-0">
              <p
                className={`text-sm font-semibold ${active || complete ? "text-text" : "text-muted"}`}
              >
                {step.title}
              </p>
              <p className="mt-0.5 text-xs text-muted">{step.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function OnboardingStepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <p className="text-sm font-medium text-muted" aria-live="polite">
      Step {currentStep} of {ONBOARDING_STEPS.length}
    </p>
  );
}
