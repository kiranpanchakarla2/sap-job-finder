import Link from "next/link";
import { MapPin } from "lucide-react";
import type { MockCompany } from "@/lib/mock-data";

type CompanyCardProps = {
  company: MockCompany;
  variant?: "default" | "top";
};

export function CompanyCard({ company, variant = "default" }: CompanyCardProps) {
  if (variant === "top") {
    return (
      <article className="flex h-full flex-col rounded-[var(--radius-card)] border border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
            style={{ backgroundColor: company.logoColor }}
          >
            {company.logo}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-text">{company.name}</h3>
              {company.featured ? (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  Featured
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 flex items-center gap-1 text-sm text-muted">
              <MapPin size={14} className="shrink-0" aria-hidden />
              {company.location}
            </p>
          </div>
        </div>

        <Link
          href={`/company/${company.id}`}
          className="mt-5 block w-full rounded-[var(--radius-control)] bg-primary/10 py-3 text-center text-sm font-semibold text-primary transition hover:bg-primary/15"
        >
          Open Position ({company.openRoles})
        </Link>
      </article>
    );
  }

  return (
    <Link
      href={`/company/${company.id}`}
      className="block rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white"
          style={{ backgroundColor: company.logoColor }}
        >
          {company.logo}
        </div>
        <div>
          <h3 className="font-semibold text-text">{company.name}</h3>
          <p className="inline-flex items-center gap-1 text-xs text-muted">
            <MapPin size={12} /> {company.location}
          </p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-muted">{company.description}</p>
      <p className="mt-4 text-xs font-medium text-primary">{company.openRoles} open roles</p>
    </Link>
  );
}
