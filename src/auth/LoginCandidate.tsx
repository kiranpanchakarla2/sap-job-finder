"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthInput } from "@/components/auth/AuthInput";
import { Divider } from "@/components/auth/Divider";
import { GoogleComingSoonButton } from "@/components/auth/GoogleComingSoonButton";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { GuestOnlyRoute } from "@/routes/GuestOnlyRoute";
import {
  candidateLoginSchema,
  type CandidateLoginValues,
} from "@/lib/validations/sapjobsfinder-auth";

export function LoginCandidate() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CandidateLoginValues>({
    resolver: zodResolver(candidateLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: CandidateLoginValues) => {
    setFormError(null);
    const result = await login(values.email, values.password, "candidate");
    if (!result.success) {
      setFormError(result.error);
      return;
    }

    toast.success("Signed in successfully");
    const next = searchParams.get("next");
    const safeNext =
      next && next.startsWith("/candidate") && !next.startsWith("//") ? next : null;
    router.push(safeNext ?? "/candidate/dashboard");
  };

  return (
    <GuestOnlyRoute expectedRole="candidate">
      <div className="mb-7 text-center lg:mb-8">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-dark sm:text-[2rem]">
          Welcome Back
        </h1>
        <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-slate-500 sm:text-[15px]">
          Sign in to continue your SAP Jobs Finder career journey.
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
            label="Email Address"
            type="email"
            autoComplete="email"
            icon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register("email")}
          />

          <PasswordInput
            label="Password"
            autoComplete="current-password"
            icon={<Lock className="h-4 w-4" />}
            error={errors.password?.message}
            {...register("password")}
          />

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="rounded text-sm font-semibold text-primary transition hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              Forgot Password?
            </Link>
          </div>

          <AuthButton loading={isSubmitting}>Sign In</AuthButton>

          <Divider />
          <GoogleComingSoonButton />
        </form>
      </AuthCard>

      <div className="mt-6 space-y-2 text-center text-sm text-slate-500">
        <p>
          Don&apos;t have an account?{" "}
          <Link
            href="/register/candidate"
            className="rounded font-semibold text-primary transition hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            Create Candidate Account
          </Link>
        </p>
        <p>
          Are you an employer?{" "}
          <Link
            href="/login/employer"
            className="rounded font-semibold text-primary transition hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            Employer Login
          </Link>
        </p>
      </div>
    </GuestOnlyRoute>
  );
}
