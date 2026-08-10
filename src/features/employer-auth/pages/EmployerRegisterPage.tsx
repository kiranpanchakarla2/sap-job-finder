"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, Lock, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthInput } from "@/components/auth/AuthInput";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AuthMessage } from "../components/AuthMessage";
import { EmployerAuthLayout } from "../components/EmployerAuthLayout";
import { useCompanySetupStatus } from "@/features/employer-company/hooks/useCompanySetupStatus";
import { useEmployerAuth } from "../hooks/useEmployerAuth";
import {
  employerSprintRegisterSchema,
  type EmployerSprintRegisterValues,
} from "../lib/validation";

export function EmployerRegisterPage() {
  const router = useRouter();
  const { register: registerEmployer, isAuthenticated } = useEmployerAuth();
  const { isChecking, getPostAuthPath } = useCompanySetupStatus();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmployerSprintRegisterValues>({
    resolver: zodResolver(employerSprintRegisterSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      jobTitle: "",
    },
  });

  useEffect(() => {
    if (isAuthenticated && !isChecking) {
      router.replace(getPostAuthPath());
    }
  }, [isAuthenticated, isChecking, getPostAuthPath, router]);

  const onSubmit = async (values: EmployerSprintRegisterValues) => {
    setFormError(null);
    const result = await registerEmployer({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword,
      jobTitle: values.jobTitle?.trim() || undefined,
    });

    if (!result.success) {
      setFormError(result.error);
      return;
    }

    toast.success(
      result.data.needsEmailConfirmation
        ? "Account created. Please verify your email."
        : "Account created successfully.",
    );
    router.push("/employer/verify-email");
  };

  return (
    <EmployerAuthLayout
      title="Create your employer account"
      subtitle="Find the right SAP talent and build your hiring pipeline with SAPJobsFinder."
      maxWidthClassName="max-w-[520px]"
      footer={
        <p>
          Already have an account?{" "}
          <Link
            href="/employer/login"
            className="rounded font-semibold text-primary transition hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError ? <AuthMessage variant="error">{formError}</AuthMessage> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthInput
            label="First Name"
            autoComplete="given-name"
            icon={<UserRound className="h-4 w-4" />}
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <AuthInput
            label="Last Name"
            autoComplete="family-name"
            icon={<UserRound className="h-4 w-4" />}
            error={errors.lastName?.message}
            {...register("lastName")}
          />
        </div>

        <AuthInput
          label="Work Email"
          type="email"
          autoComplete="email"
          icon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <AuthInput
          label="Job Title / Designation"
          autoComplete="organization-title"
          icon={<Briefcase className="h-4 w-4" />}
          error={errors.jobTitle?.message}
          {...register("jobTitle")}
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

        <AuthButton loading={isSubmitting} loadingLabel="Creating account...">
          Create Employer Account
        </AuthButton>
      </form>
    </EmployerAuthLayout>
  );
}
