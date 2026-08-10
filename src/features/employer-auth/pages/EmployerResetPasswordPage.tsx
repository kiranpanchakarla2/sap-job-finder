"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { AuthButton } from "@/components/auth/AuthButton";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AuthMessage } from "../components/AuthMessage";
import { EmployerAuthLayout } from "../components/EmployerAuthLayout";
import { useEmployerAuth } from "../hooks/useEmployerAuth";
import {
  employerSprintResetPasswordSchema,
  type EmployerSprintResetPasswordValues,
} from "../lib/validation";

export function EmployerResetPasswordPage() {
  const router = useRouter();
  const { resetPassword } = useEmployerAuth();
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmployerSprintResetPasswordValues>({
    resolver: zodResolver(employerSprintResetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: EmployerSprintResetPasswordValues) => {
    setFormError(null);
    const result = await resetPassword(values);
    if (!result.success) {
      setFormError(result.error);
      return;
    }
    setSuccess(true);
    toast.success("Password updated");
  };

  return (
    <EmployerAuthLayout
      title={success ? "Password updated" : "Create a new password"}
      subtitle={
        success
          ? "Your password has been successfully updated."
          : "Choose a new password with at least 8 characters."
      }
      footer={
        success ? null : (
          <p>
            <Link
              href="/employer/login"
              className="rounded font-semibold text-primary transition hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              Back to Sign In
            </Link>
          </p>
        )
      }
    >
      {success ? (
        <div className="space-y-5">
          <AuthMessage variant="success" title="Password updated">
            Your password has been successfully updated.
          </AuthMessage>
          <AuthButton type="button" onClick={() => router.push("/employer/login")}>
            Continue to Sign In
          </AuthButton>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {formError ? <AuthMessage variant="error">{formError}</AuthMessage> : null}

          <AuthMessage variant="info">At least 8 characters</AuthMessage>

          <PasswordInput
            label="New Password"
            autoComplete="new-password"
            icon={<Lock className="h-4 w-4" />}
            error={errors.password?.message}
            {...register("password")}
          />

          <PasswordInput
            label="Confirm New Password"
            autoComplete="new-password"
            icon={<Lock className="h-4 w-4" />}
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <AuthButton loading={isSubmitting} loadingLabel="Updating password...">
            Reset Password
          </AuthButton>
        </form>
      )}
    </EmployerAuthLayout>
  );
}
