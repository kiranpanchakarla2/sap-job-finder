"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Building2,
  File,
  FileText,
  Heart,
  LayoutDashboard,
  Settings,
  Target,
  User,
} from "lucide-react";
import { candidateSidebarLinks } from "@/lib/constants";
import { BrandLogo } from "@/components/layout/BrandLogo";

const icons = {
  LayoutDashboard,
  Briefcase,
  FileText,
  User,
  File,
  Target,
  Building2,
  Heart,
  Settings,
} as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
      <div className="sticky top-0 flex h-screen flex-col px-4 py-5">
        <BrandLogo href="/" className="mb-8 px-2" />

        <nav className="flex flex-1 flex-col gap-1" aria-label="Candidate">
          {candidateSidebarLinks.map((link) => {
            const Icon = icons[link.icon as keyof typeof icons] ?? Briefcase;
            const active =
              pathname === link.href ||
              (link.href !== "/dashboard" && pathname.startsWith(link.href.split("?")[0]));
            const disabled = "disabled" in link && link.disabled;

            if (disabled) {
              return (
                <span
                  key={link.label}
                  className="inline-flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium text-muted/60"
                  title="Coming soon"
                >
                  <Icon size={18} />
                  {link.label}
                </span>
              );
            }

            return (
              <Link
                key={link.label}
                href={link.href}
                className={`inline-flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:bg-surface hover:text-text"
                }`}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
