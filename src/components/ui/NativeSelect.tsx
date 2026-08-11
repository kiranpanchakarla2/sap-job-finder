"use client";

import {
  forwardRef,
  useId,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";

type NativeSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  /** Extra classes for the outer wrapper (margin, width, etc.). */
  wrapperClassName?: string;
  /** Optional icon rendered to the left of the select. */
  leading?: ReactNode;
  /** Optional visible label rendered above the select with consistent spacing. */
  label?: ReactNode;
  /** Extra classes for the optional label. */
  labelClassName?: string;
};

/** Native select with an inset chevron that stays visible across themes. */
export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  function NativeSelect(
    {
      className = "",
      wrapperClassName = "",
      leading,
      label,
      labelClassName = "",
      id,
      children,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <div className={wrapperClassName.trim() || undefined}>
        {label ? (
          <label
            htmlFor={selectId}
            className={
              labelClassName.trim() ||
              "mb-2.5 block text-sm font-medium text-text"
            }
          >
            {label}
          </label>
        ) : null}
        <div className="relative">
          {leading}
          <select
            ref={ref}
            id={selectId}
            data-chevron="custom"
            className={`w-full appearance-none pr-10 ${className}`.trim()}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
        </div>
      </div>
    );
  },
);
