"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthInput } from "@/components/auth/AuthInput";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { EMPLOYER_ROUTES } from "@/features/employer-company/constants";
import { companyService } from "@/features/employer-company/services/companyService";
import { useCompanySetupStatus } from "@/features/employer-company/hooks/useCompanySetupStatus";
import { AuthMessage } from "../components/AuthMessage";
import { EmployerAuthLayout } from "../components/EmployerAuthLayout";
import { useEmployerAuth } from "../hooks/useEmployerAuth";
import {
  employerSprintLoginSchema,
  type EmployerSprintLoginValues,
} from "../lib/validation";

function resolveSafeNext(next: string | null) {
  if (
    next &&
    next.startsWith("/employer") &&
    !next.startsWith("//") &&
    !next.includes("/login")
  ) {
    return next;
  }
  return null;
}

export function EmployerLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useEmployerAuth();
  const { setupComplete, isChecking, getPostAuthPath } = useCompanySetupStatus();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmployerSprintLoginValues>({
    resolver: zodResolver(employerSprintLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (isAuthenticated && !isChecking) {
      router.replace(getPostAuthPath(searchParams.get("next")));
    }
  }, [isAuthenticated, isChecking, getPostAuthPath, router, searchParams, setupComplete]);

  const onSubmit = async (values: EmployerSprintLoginValues) => {
    setFormError(null);
    const result = await login(values);
    if (!result.success) {
      setFormError(result.error);
      return;
    }

    toast.success("Signed in successfully");
    const complete = await companyService.isSetupComplete(result.data.employer.id);
    const safeNext = resolveSafeNext(searchParams.get("next"));
    router.push(complete ? (safeNext ?? EMPLOYER_ROUTES.dashboard) : EMPLOYER_ROUTES.onboarding);
  };

  return (
    <EmployerAuthLayout
      title="Welcome back"
      subtitle="Sign in to manage your jobs, candidates and hiring activity."
      footer={
        <p>
          Create account?{" "}
          <Link
            href="/employer/register"
            className="rounded font-semibold text-primary transition hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            Create an employer account
          </Link>
        </p>
      }
    >
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

        <PasswordInput
          label="Password"
          autoComplete="current-password"
          icon={<Lock className="h-4 w-4" />}
          error={errors.password?.message}
          {...register("password")}
        />

        <div className="flex justify-end">
          <Link
            href="/employer/forgot-password"
            className="rounded text-sm font-semibold text-primary transition hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            Forgot password?
          </Link>
        </div>

        <AuthButton loading={isSubmitting} loadingLabel="Signing in...">
          Sign In
        </AuthButton>
      </form>
    </EmployerAuthLayout>
  );
}
