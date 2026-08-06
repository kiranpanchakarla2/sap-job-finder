"use client";

import {
  forwardRef,
  useId,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

type AuthSelectProps = {
  label: string;
  icon?: ReactNode;
  error?: string;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "id">;

export const AuthSelect = forwardRef<HTMLSelectElement, AuthSelectProps>(
  function AuthSelect(
    { label, icon, error, options, placeholder = "Select an option", ...props },
    ref,
  ) {
    const id = useId();
    const errorId = `${id}-error`;
    const reduceMotion = useReducedMotion();

    return (
      <motion.div
        className="relative"
        animate={
          error && !reduceMotion ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }
        }
        transition={{ duration: 0.4 }}
      >
        <div
          className={`group relative flex h-14 items-center rounded-2xl border bg-input transition-all duration-300 ${
            error
              ? "border-red-400 shadow-[0_0_0_4px_rgba(248,113,113,0.15)]"
              : "border-border focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgba(79,70,229,0.12)] hover:border-muted"
          }`}
        >
          {icon ? (
            <span
              className={`pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 transition-colors duration-300 ${
                error ? "text-red-400" : "text-muted group-focus-within:text-primary"
              }`}
              aria-hidden="true"
            >
              {icon}
            </span>
          ) : null}

          <select
            ref={ref}
            id={id}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className={`peer h-full w-full appearance-none rounded-2xl bg-transparent px-4 pb-2 pt-5 text-sm font-medium text-input-fg outline-none ${
              icon ? "pl-11" : ""
            } pr-10`}
            {...props}
          >
            <option value="" disabled className="bg-input text-input-fg">
              {placeholder}
            </option>
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className="bg-input text-input-fg"
              >
                {option.label}
              </option>
            ))}
          </select>

          <label
            htmlFor={id}
            className={`pointer-events-none absolute top-3 origin-left text-[11px] font-semibold transition-colors duration-200 ${
              icon ? "left-11" : "left-4"
            } ${error ? "text-red-400" : "text-muted peer-focus:text-primary"}`}
          >
            {label}
          </label>

          <ChevronDown
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
        </div>

        <AnimatePresence>
          {error ? (
            <motion.p
              id={errorId}
              role="alert"
              initial={reduceMotion ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-2 px-1 text-xs font-medium text-red-500"
            >
              {error}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </motion.div>
    );
  },
);
