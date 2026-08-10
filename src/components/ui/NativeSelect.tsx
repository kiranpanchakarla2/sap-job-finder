"use client";

import {
  forwardRef,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";

type NativeSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  /** Extra classes for the outer wrapper (margin, width, etc.). */
  wrapperClassName?: string;
  /** Optional icon rendered to the left of the select. */
  leading?: ReactNode;
};

/** Native select with an inset chevron that stays visible across themes. */
export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  function NativeSelect(
    { className = "", wrapperClassName = "", leading, children, ...props },
    ref,
  ) {
    return (
      <div className={`relative ${wrapperClassName}`.trim()}>
        {leading}
        <select
          ref={ref}
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
    );
  },
);
