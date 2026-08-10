"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthMessage } from "../components/AuthMessage";
import { EmployerAuthLayout } from "../components/EmployerAuthLayout";
import { useEmployerAuth } from "../hooks/useEmployerAuth";
import {
  employerSprintForgotPasswordSchema,
  type EmployerSprintForgotPasswordValues,
} from "../lib/validation";

export function EmployerForgotPasswordPage() {
  const router = useRouter();
  const { requestPasswordReset } = useEmployerAuth();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmployerSprintForgotPasswordValues>({
    resolver: zodResolver(employerSprintForgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: EmployerSprintForgotPasswordValues) => {
    setFormError(null);
    const result = await requestPasswordReset(values);
    if (!result.success) {
      setFormError(result.error);
      return;
    }
    setSubmittedEmail(result.data.email);
  };

  return (
    <EmployerAuthLayout
      title={submittedEmail ? "Check your email" : "Forgot your password?"}
      subtitle={
        submittedEmail
          ? "If an account exists for this email, we've sent instructions to reset your password."
          : "Enter your work email and we'll help you reset your password."
      }
      footer={
        <p>
          <Link
            href="/employer/login"
            className="rounded font-semibold text-primary transition hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            Back to Sign In
          </Link>
        </p>
      }
    >
      {submittedEmail ? (
        <div className="space-y-5">
          <AuthMessage variant="success" title="Reset link sent">
            If an account exists for{" "}
            <span className="font-semibold">{submittedEmail}</span>, you&apos;ll
            receive password reset instructions shortly.
          </AuthMessage>
          <AuthButton type="button" variant="secondary" onClick={() => router.push("/employer/login")}>
            Back to Sign In
          </AuthButton>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {formError ? <AuthMessage variant="error">{formError}</AuthMessage> : null}

          <AuthInput
            label="Work Email"
            type="email"
            autoComplete="email"
            icon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register("email")}
          />

          <AuthButton loading={isSubmitting} loadingLabel="Sending reset link...">
            Send Reset Link
          </AuthButton>
        </form>
      )}
    </EmployerAuthLayout>
  );
}
