import Link from "next/link";
import { siteConfig } from "@/lib/constants";

type BrandLogoProps = {
  href?: string;
  className?: string;
  onClick?: () => void;
  /** Show only the mark (used by collapsed desktop sidebars). */
  markOnly?: boolean;
};

/**
 * Shared product mark — SAP Jobs Finder.
 */
export function BrandLogo({
  href = "/",
  className = "",
  onClick,
  markOnly = false,
}: BrandLogoProps) {
  const content = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-bold text-background shadow-[0_8px_20px_color-mix(in_srgb,var(--primary)_30%,transparent)] transition-transform duration-300 group-hover:scale-105">
        {siteConfig.logoMark}
      </span>
      {!markOnly ? (
        <span className="text-[15px] font-semibold leading-tight tracking-tight text-text">
          {siteConfig.logoPrimary}
          <span className="font-medium text-muted">{siteConfig.logoAccent}</span>
        </span>
      ) : null}
    </>
  );

  const classes = `group inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${className}`.trim();

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={classes}
        aria-label={`${siteConfig.name} home`}
      >
        {content}
      </Link>
    );
  }

  return (
    <span className={classes}>
      {content}
    </span>
  );
}
