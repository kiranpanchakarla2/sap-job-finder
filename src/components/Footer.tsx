import Link from "next/link";
import { Linkedin, Twitter } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { siteConfig } from "@/lib/constants";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Jobs", href: "/jobs" },
      { label: "Companies", href: "/companies" },
      { label: "Services", href: "/services" },
      { label: "Mock Interview", href: "/mock-interview" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "For candidates",
    links: [
      { label: "Create profile", href: "/signup" },
      { label: "Upload resume", href: "/profile?tab=resume" },
      { label: "Applications", href: "/applications" },
    ],
  },
  {
    title: "For employers",
    links: [
      { label: "Recruiter login", href: "/signin" },
      { label: "Post jobs", href: "/recruiter" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <BrandLogo href="/" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              {siteConfig.tagline}. Built for SAP professionals shaping tomorrow&apos;s enterprise.
            </p>
            <div className="mt-6 flex items-center gap-2">
              {[Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted transition hover:text-primary"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-text">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition hover:text-text"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border pt-6 text-xs text-muted">
          <span>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
