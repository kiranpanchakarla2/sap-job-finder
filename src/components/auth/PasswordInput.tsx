"use client";

import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = {
  label?: string;
  icon?: ReactNode;
  error?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "id" | "type">;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    { label = "Password", icon, error, ...props },
    ref,
  ) {
    const id = useId();
    const errorId = `${id}-error`;
    const reduceMotion = useReducedMotion();
    const [visible, setVisible] = useState(false);

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

          <input
            ref={ref}
            id={id}
            type={visible ? "text" : "password"}
            placeholder=" "
            autoComplete={props.autoComplete ?? "current-password"}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className={`peer h-full w-full rounded-2xl bg-transparent px-4 pb-2 pt-5 pr-12 text-sm font-medium text-input-fg outline-none ${
              icon ? "pl-11" : ""
            }`}
            {...props}
          />

          <label
            htmlFor={id}
            className={`pointer-events-none absolute top-1/2 origin-left -translate-y-1/2 text-sm text-muted transition-all duration-200 peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold ${
              icon ? "left-11" : "left-4"
            }`}
          >
            {label}
          </label>

          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
          >
            {visible ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
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
