import Link from "next/link";
import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { PublicLayout } from "@/layouts/PublicLayout";
import { getServiceHref, serviceGroups } from "@/lib/services-nav";

type ServicesLayoutProps = {
  title: string;
  subtitle: string;
  categoryId: string;
  activeSlug: string;
  children: ReactNode;
};

export function ServicesLayout({
  title,
  subtitle,
  categoryId,
  activeSlug,
  children,
}: ServicesLayoutProps) {
  return (
    <PublicLayout>
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-28 sm:px-8">
        <nav className="text-sm text-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-text">Services</span>
          <span className="mx-2">/</span>
          <span className="font-medium text-text">{title}</span>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-12">
          <aside className="hidden lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Services
            </p>
            <div className="mt-4 space-y-5">
              {serviceGroups.map((group) => (
                <div key={group.id}>
                  <p className="px-3 text-xs font-bold uppercase tracking-wide text-muted">
                    {group.label}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {group.links.map((link) => {
                      const href = getServiceHref(group.id, link.slug);
                      const isActive = group.id === categoryId && link.slug === activeSlug;
                      return (
                        <li key={href}>
                          <Link
                            href={href}
                            className={`block rounded-lg px-3 py-2 text-sm transition ${
                              isActive
                                ? "bg-primary/10 font-semibold text-primary"
                                : "text-muted hover:bg-surface hover:text-text"
                            }`}
                          >
                            {link.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </aside>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">{subtitle}</p>
            <div className="mt-10">{children}</div>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
}
