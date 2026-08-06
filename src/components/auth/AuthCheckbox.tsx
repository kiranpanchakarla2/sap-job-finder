"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

type AuthCheckboxProps = {
  label: ReactNode;
  error?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className" | "id">;

export function AuthCheckbox({ label, error, checked, ...props }: AuthCheckboxProps) {
  const id = useId();
  const reduceMotion = useReducedMotion();

  return (
    <div>
      <label
        htmlFor={id}
        className="group flex cursor-pointer items-start gap-3 rounded-md focus-within:outline-none"
      >
        <span className="relative mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            className="peer sr-only"
            aria-invalid={Boolean(error)}
            {...props}
          />
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-[7px] border transition-all duration-200 ${
              error
                ? "border-red-400 bg-red-50"
                : "border-border bg-white group-hover:border-primary/40 peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20"
            }`}
          >
            <motion.span
              initial={false}
              animate={{
                scale: checked ? 1 : 0.4,
                opacity: checked ? 1 : 0,
              }}
              transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 28 }}
            >
              <Check className="h-3 w-3 text-white" strokeWidth={3} aria-hidden="true" />
            </motion.span>
          </span>
        </span>
        <span className="text-sm leading-relaxed text-slate-500 transition-colors group-hover:text-slate-600">
          {label}
        </span>
      </label>
      {error ? (
        <p role="alert" className="mt-2 text-xs font-medium text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}
