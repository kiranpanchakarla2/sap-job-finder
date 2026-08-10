"use client";

import Link from "next/link";
import { siteConfig } from "@/lib/constants";

type EmployerAuthHeaderProps = {
  title: string;
  subtitle: string;
};

/**
 * Header for the employer auth form column.
 * Uses theme tokens so light/dark mode stay readable.
 */
export function EmployerAuthHeader({ title, subtitle }: EmployerAuthHeaderProps) {
  return (
    <div className="mb-7 flex flex-col items-center text-center lg:mb-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        aria-label={`${siteConfig.name} home`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-bold text-white shadow-[0_8px_20px_color-mix(in_srgb,var(--primary)_35%,transparent)]">
          {siteConfig.logoMark}
        </span>
        <span className="text-[15px] font-semibold leading-tight tracking-tight text-text">
          {siteConfig.logoPrimary}
          <span className="font-medium text-muted">{siteConfig.logoAccent}</span>
        </span>
      </Link>

      <h1 className="text-balance text-3xl font-bold tracking-tight text-text sm:text-[2rem]">
        {title}
      </h1>
      <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-muted sm:text-[15px]">
        {subtitle}
      </p>
    </div>
  );
}
