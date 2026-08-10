"use client";

import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

type AuthMessageVariant = "error" | "success" | "info";

type AuthMessageProps = {
  children: ReactNode;
  variant?: AuthMessageVariant;
  title?: string;
  className?: string;
};

const styles: Record<
  AuthMessageVariant,
  { wrap: string; icon: typeof AlertCircle }
> = {
  error: {
    wrap: "border-red-200 bg-red-50 text-red-700",
    icon: AlertCircle,
  },
  success: {
    wrap: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: CheckCircle2,
  },
  info: {
    wrap: "border-border bg-surface text-slate-600",
    icon: Info,
  },
};

export function AuthMessage({
  children,
  variant = "info",
  title,
  className = "",
}: AuthMessageProps) {
  const { wrap, icon: Icon } = styles[variant];
  const role = variant === "error" ? "alert" : "status";

  return (
    <div
      role={role}
      className={`flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-sm ${wrap} ${className}`.trim()}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
