"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthInput } from "@/components/auth/AuthInput";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/validations/sapjobsfinder-auth";
import { resetPassword } from "@/services/authService";

export function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setFormError(null);
    const result = await resetPassword(values.email);
    if (!result.success) {
      setFormError(result.error);
      return;
    }
    setSubmitted(true);
  };

  return (
    <>
      <div className="mb-7 text-center lg:mb-8">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-dark sm:text-[2rem]">
          Forgot Password
        </h1>
        <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-slate-500 sm:text-[15px]">
          Enter your email and we&apos;ll send a Supabase password reset link.
        </p>
      </div>

      <AuthCard>
        {submitted ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted" role="status">
              If an account exists for that email, you will receive reset instructions shortly.
            </p>
            <Link
              href="/login/candidate"
              className="inline-flex text-sm font-semibold text-primary hover:text-accent"
            >
              Back to Candidate Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {formError ? (
              <p
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-600"
              >
                {formError}
              </p>
            ) : null}
            <AuthInput
              label="Email Address"
              type="email"
              autoComplete="email"
              icon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register("email")}
            />
            <AuthButton loading={isSubmitting}>Send Reset Link</AuthButton>
          </form>
        )}
      </AuthCard>

      <div className="mt-6 space-y-2 text-center text-sm text-slate-500">
        <p>
          <Link
            href="/login/candidate"
            className="rounded font-semibold text-primary transition hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            Candidate Login
          </Link>
          {" · "}
          <Link
            href="/employer/login"
            className="rounded font-semibold text-primary transition hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            Employer Login
          </Link>
        </p>
      </div>
    </>
  );
}
