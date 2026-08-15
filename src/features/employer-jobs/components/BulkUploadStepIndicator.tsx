import { CheckCircle2, ClipboardCheck, FileSpreadsheet, Sparkles } from "lucide-react";

type StepStatus = "upcoming" | "current" | "complete";

interface Step {
  id: number;
  title: string;
  description: string;
  icon: typeof FileSpreadsheet;
  status: StepStatus;
}

interface BulkUploadStepIndicatorProps {
  currentStep: 1 | 2 | 3;
  fileSelected?: boolean;
}

export function BulkUploadStepIndicator({
  currentStep,
  fileSelected = false,
}: BulkUploadStepIndicatorProps) {
  const getStepStatus = (stepId: number): StepStatus => {
    if (stepId < currentStep) return "complete";
    if (stepId === currentStep) return "current";
    return "upcoming";
  };

  const steps: Step[] = [
    {
      id: 1,
      title: "1. Upload",
      description: "Get template & upload spreadsheet",
      icon: FileSpreadsheet,
      status: currentStep > 1 ? "complete" : fileSelected ? "complete" : "current",
    },
    {
      id: 2,
      title: "2. Validate",
      description: "Parse headers, data & constraints",
      icon: Sparkles,
      status: currentStep > 2 ? "complete" : currentStep === 2 ? "current" : "upcoming",
    },
    {
      id: 3,
      title: "3. Review",
      description: "Review jobs & confirm import",
      icon: ClipboardCheck,
      status: currentStep === 3 ? "current" : "upcoming",
    },
  ];

  return (
    <nav
      aria-label="Bulk Upload Steps"
      className="rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-soft sm:p-5"
    >
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {steps.map((step) => {
          const Icon = step.icon;
          const isComplete = step.status === "complete";
          const isCurrent = step.status === "current";

          return (
            <li
              key={step.id}
              className={`relative flex items-start gap-3 rounded-xl p-3 transition-colors ${
                isCurrent
                  ? "bg-primary/5 border border-primary/20 shadow-xs"
                  : isComplete
                  ? "bg-surface border border-border"
                  : "bg-surface/50 border border-border/60 opacity-80"
              }`}
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-semibold text-sm transition-colors ${
                  isComplete
                    ? "bg-success/15 text-success"
                    : isCurrent
                    ? "bg-primary text-white shadow-soft"
                    : "bg-border text-muted"
                }`}
                aria-hidden="true"
              >
                {isComplete ? <CheckCircle2 size={18} /> : <Icon size={16} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isCurrent
                        ? "text-primary"
                        : isComplete
                        ? "text-text"
                        : "text-muted"
                    }`}
                  >
                    {step.title}
                  </p>
                  {step.id === 3 && isCurrent ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      Current
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-muted truncate">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
