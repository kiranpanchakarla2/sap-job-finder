"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { authNav } from "@/lib/main-nav";

type AuthActionsProps = {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
};

export function AuthActions({ variant = "desktop", onNavigate }: AuthActionsProps) {
  if (variant === "mobile") {
    return (
      <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
        <Button href={authNav.signIn.href} onClick={onNavigate}>
          {authNav.signIn.label}
          <ArrowRight size={16} aria-hidden="true" />
        </Button>
        <Button href={authNav.employers.href} variant="ghost" onClick={onNavigate}>
          {authNav.employers.label}
        </Button>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-2 md:flex">
      <Button href={authNav.signIn.href} className="px-4 py-2.5">
        {authNav.signIn.label}
        <ArrowRight size={15} aria-hidden="true" />
      </Button>
      <Button
        href={authNav.employers.href}
        variant="ghost"
        className="px-3.5 py-2.5 text-[13px] text-muted hover:text-text xl:text-sm"
      >
        {authNav.employers.label}
      </Button>
    </div>
  );
}
