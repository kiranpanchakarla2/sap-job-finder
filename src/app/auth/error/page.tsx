import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { siteConfig } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Verification issue — ${siteConfig.name}`,
  description: "Your email verification link could not be completed.",
};

type AuthErrorPageProps = {
  searchParams: Promise<{ message?: string }>;
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = await searchParams;
  const message =
    params.message?.trim() ||
    "This verification link is invalid or has expired. Please try signing in or create a new account.";

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-surface px-5 py-16 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#eef2ff_48%,#ffffff_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-50 grid-pattern" />

      <div className="relative w-full max-w-md rounded-[24px] border border-white/70 bg-white/75 p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </span>

        <h1 className="text-2xl font-bold tracking-tight text-dark">
          Link could not be verified
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">{message}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/signin"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-accent px-5 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(79,70,229,0.32)] transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
          >
            Back to sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-border bg-white px-5 text-sm font-semibold text-dark shadow-soft transition hover:border-primary/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
