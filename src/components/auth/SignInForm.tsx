"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthCheckbox } from "@/components/auth/AuthCheckbox";
import { AuthInput } from "@/components/auth/AuthInput";
import { Divider } from "@/components/auth/Divider";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import {
  getSignedInHomePath,
  getSignedInRole,
  signInWithEmail,
} from "@/lib/auth/client";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { getHomePathForRole, isInstitutionRole } from "@/lib/auth/roles";
import { signInSchema, type SignInValues } from "@/lib/validations/auth";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: true,
    },
  });

  const remember = watch("remember");

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setFormError(error);
    }
  }, [searchParams]);

  const onSubmit = async (values: SignInValues) => {
    setFormError(null);

    const { error } = await signInWithEmail(values.email, values.password);

    if (error) {
      setFormError(getAuthErrorMessage(error));
      return;
    }

    const role = await getSignedInRole();
    const nextParam = searchParams.get("next");
    const safeNext =
      nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
        ? nextParam
        : null;

    // Institution accounts belong on the Institution Platform.
    if (role && isInstitutionRole(role)) {
      toast.success("Signed in successfully");
      router.push(getHomePathForRole(role));
      router.refresh();
      return;
    }

    const next = safeNext ?? (await getSignedInHomePath());

    toast.success("Signed in successfully");
    router.push(next);
    router.refresh();
  };

  return (
    <>
      <div className="mb-7 text-center lg:mb-8">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-dark sm:text-[2rem]">
          Welcome back
        </h1>
        <p className="mt-2.5 max-w-sm mx-auto text-sm leading-relaxed text-slate-500 sm:text-[15px]">
          Sign in to explore SAP roles and manage your applications.
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
            label="Email"
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

          <div className="flex items-center justify-between gap-3 pt-1">
            <AuthCheckbox
              label="Remember me"
              checked={Boolean(remember)}
              onChange={(e) =>
                setValue("remember", e.target.checked, { shouldDirty: true })
              }
            />
            <Link
              href="/forgot-password"
              className="rounded text-sm font-semibold text-primary transition hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              Forgot password?
            </Link>
          </div>

          <div className="pt-1">
            <AuthButton loading={isSubmitting}>Sign in</AuthButton>
          </div>

          <Divider />

          <SocialAuthButtons />
        </form>
      </AuthCard>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="rounded font-semibold text-primary transition hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          Create account
        </Link>
      </p>
    </>
  );
}
