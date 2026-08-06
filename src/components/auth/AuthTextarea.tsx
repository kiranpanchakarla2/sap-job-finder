"use client";

import {
  forwardRef,
  useId,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type AuthTextareaProps = {
  label: string;
  icon?: ReactNode;
  error?: string;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "id">;

export const AuthTextarea = forwardRef<HTMLTextAreaElement, AuthTextareaProps>(
  function AuthTextarea({ label, icon, error, rows = 4, ...props }, ref) {
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
          className={`group relative rounded-2xl border bg-input transition-all duration-300 ${
            error
              ? "border-red-400 shadow-[0_0_0_4px_rgba(248,113,113,0.15)]"
              : "border-border focus-within:border-primary focus-within:shadow-[0_0_0_4px_rgba(79,70,229,0.12)] hover:border-muted"
          }`}
        >
          {icon ? (
            <span
              className={`pointer-events-none absolute left-4 top-5 z-10 transition-colors duration-300 ${
                error ? "text-red-400" : "text-muted group-focus-within:text-primary"
              }`}
              aria-hidden="true"
            >
              {icon}
            </span>
          ) : null}

          <textarea
            ref={ref}
            id={id}
            rows={rows}
            placeholder=" "
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className={`peer w-full resize-y rounded-2xl bg-transparent px-4 pb-3 pt-6 text-sm font-medium text-input-fg outline-none ${
              icon ? "pl-11" : ""
            }`}
            {...props}
          />

          <label
            htmlFor={id}
            className={`pointer-events-none absolute top-4 origin-left text-sm text-muted transition-all duration-200 peer-focus:top-2.5 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold ${
              icon ? "left-11" : "left-4"
            }`}
          >
            {label}
          </label>
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
