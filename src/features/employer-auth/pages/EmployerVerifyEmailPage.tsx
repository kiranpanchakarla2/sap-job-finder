"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthMessage } from "../components/AuthMessage";
import { EmployerAuthLayout } from "../components/EmployerAuthLayout";
import { useEmployerAuth } from "../hooks/useEmployerAuth";

const RESEND_COOLDOWN_SECONDS = 30;

export function EmployerVerifyEmailPage() {
  const router = useRouter();
  const { pendingVerificationEmail, resendVerificationEmail } = useEmployerAuth();
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const email = pendingVerificationEmail;

  const onResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    const result = await resendVerificationEmail();
    setResending(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Verification email sent.");
    setCooldown(RESEND_COOLDOWN_SECONDS);
  };

  const onOpenEmail = () => {
    toast.message("Open your inbox to continue verification.");
    window.open("https://mail.google.com", "_blank", "noopener,noreferrer");
  };

  const onChangeEmail = () => {
    router.push("/employer/register");
  };

  return (
    <EmployerAuthLayout
      title="Verify your email"
      subtitle="We've sent a verification link to your work email."
      footer={
        <p>
          Wrong account?{" "}
          <Link
            href="/employer/login"
            className="rounded font-semibold text-primary transition hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            Back to Sign In
          </Link>
        </p>
      }
    >
      <div className="space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Mail className="h-6 w-6" aria-hidden="true" />
        </div>

        <AuthMessage variant="info">
          {email ? (
            <>
              We&apos;ve sent a verification link to{" "}
              <span className="font-semibold text-dark">{email}</span>
            </>
          ) : (
            <>We&apos;ve sent a verification link to your work email.</>
          )}
        </AuthMessage>

        <AuthButton type="button" onClick={onOpenEmail}>
          Open Email
        </AuthButton>

        <div className="space-y-3 text-center">
          <button
            type="button"
            onClick={onResend}
            disabled={cooldown > 0 || resending}
            className="rounded text-sm font-semibold text-primary transition hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resending
              ? "Sending..."
              : cooldown > 0
                ? `Resend available in ${cooldown}s`
                : "Resend verification email"}
          </button>

          <div>
            <button
              type="button"
              onClick={onChangeEmail}
              className="rounded text-sm font-medium text-slate-500 transition hover:text-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              Change email
            </button>
          </div>
        </div>

        <div className="border-t border-border pt-5">
          <AuthButton
            type="button"
            variant="secondary"
            onClick={() => router.push("/employer/login")}
          >
            Continue to Sign In
          </AuthButton>
        </div>
      </div>
    </EmployerAuthLayout>
  );
}
