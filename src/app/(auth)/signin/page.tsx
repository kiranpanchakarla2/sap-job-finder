import { Suspense } from "react";
import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/SignInForm";
import { siteConfig } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Sign In — ${siteConfig.name}`,
  description: `Welcome back. Sign in to ${siteConfig.name} and continue your SAP job search.`,
};

function SignInFallback() {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInForm />
    </Suspense>
  );
}
