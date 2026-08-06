"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Lock, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthInput } from "@/components/auth/AuthInput";
import { Divider } from "@/components/auth/Divider";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { signUpWithEmail, getSignedInHomePath } from "@/lib/auth/client";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { signUpSchema, type SignUpValues } from "@/lib/validations/auth";

export function SignUpForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: SignUpValues) => {
    setFormError(null);

    const { data, error } = await signUpWithEmail({
      email: values.email,
      password: values.password,
      fullName: values.fullName,
    });

    if (error) {
      setFormError(getAuthErrorMessage(error));
      return;
    }

    // Supabase returns an empty identities array when the email is already registered
    // but confirmations are enabled (avoids leaking existence in some configs).
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setFormError(
        "An account with this email already exists. Try signing in instead.",
      );
      return;
    }

    if (data.session) {
      toast.success("Account created");
      router.push(await getSignedInHomePath());
      router.refresh();
      return;
    }

    setPendingVerificationEmail(values.email);
    toast.success("Check your email to verify your account");
  };

  if (pendingVerificationEmail) {
    return (
      <>
        <div className="mb-7 text-center lg:mb-8">
          <h1 className="text-balance text-3xl font-bold tracking-tight text-dark sm:text-[2rem]">
            Check your email
          </h1>
          <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-slate-500 sm:text-[15px]">
            We sent a verification link to confirm your account.
          </p>
        </div>

        <AuthCard>
          <div className="flex flex-col items-center py-4 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
            </span>
            <p className="text-sm leading-relaxed text-slate-500">
              Open the link sent to{" "}
              <span className="font-semibold text-dark">{pendingVerificationEmail}</span>{" "}
              to verify your email, then sign in.
            </p>
            <Link
              href="/signin"
              className="mt-6 rounded text-sm font-semibold text-primary transition hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              Back to sign in
            </Link>
          </div>
        </AuthCard>
      </>
    );
  }

  return (
    <>
      <div className="mb-7 text-center lg:mb-8">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-dark sm:text-[2rem]">
          Create your account
        </h1>
        <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-slate-500 sm:text-[15px]">
          Create your SAP career profile and start applying.
        </p>
      </div>

      <AuthCard>
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
            label="Full Name"
            type="text"
            autoComplete="name"
            icon={<UserRound className="h-4 w-4" />}
            error={errors.fullName?.message}
            {...register("fullName")}
          />

          <AuthInput
            label="Email"
            type="email"
            autoComplete="email"
            icon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register("email")}
          />

          <PasswordInput
            label="Password"
            autoComplete="new-password"
            icon={<Lock className="h-4 w-4" />}
            error={errors.password?.message}
            {...register("password")}
          />

          <PasswordInput
            label="Confirm Password"
            autoComplete="new-password"
            icon={<Lock className="h-4 w-4" />}
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <div className="pt-1">
            <AuthButton loading={isSubmitting}>Create account</AuthButton>
          </div>

          <Divider />

          <SocialAuthButtons />
        </form>
      </AuthCard>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link
          href="/signin"
          className="rounded font-semibold text-primary transition hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
