"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Globe, Lock, Mail, Phone, UserRound, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthContext";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthCheckbox } from "@/components/auth/AuthCheckbox";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthSelect } from "@/components/auth/AuthSelect";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { GuestOnlyRoute } from "@/routes/GuestOnlyRoute";
import {
  employerRegisterSchema,
  type EmployerRegisterValues,
} from "@/lib/validations/erpjobs-auth";
import { COMPANY_SIZE_OPTIONS, INDUSTRY_OPTIONS } from "@/types/employer";

export function RegisterEmployer() {
  const { registerEmployer } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EmployerRegisterValues>({
    resolver: zodResolver(employerRegisterSchema),
    defaultValues: {
      companyName: "",
      recruiterName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      website: "",
      terms: false,
    },
  });

  const terms = watch("terms");

  const onSubmit = async (values: EmployerRegisterValues) => {
    setFormError(null);
    const result = await registerEmployer({
      ...values,
      terms: true,
    });
    if (!result.success) {
      setFormError(result.error);
      return;
    }
    if (result.needsEmailConfirmation) {
      setNeedsEmailConfirmation(true);
      toast.success("Please check your email to verify your account.");
      return;
    }
    toast.success("Employer account created");
    router.push("/employer/dashboard");
  };

  return (
    <GuestOnlyRoute expectedRole="employer">
      <div className="mb-6 text-center lg:mb-7">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-dark sm:text-[2rem]">
          Register Your Company
        </h1>
        <p className="mx-auto mt-2.5 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-[15px]">
          Find and hire SAP professionals with SAP Jobs Finder.
        </p>
      </div>

      <AuthCard className="sm:p-8 lg:p-10">
        {needsEmailConfirmation ? (
          <div className="space-y-4 text-center">
            <p className="text-sm leading-relaxed text-slate-600" role="status">
              Please check your email to verify your account.
            </p>
            <Link
              href="/login/employer"
              className="inline-flex text-sm font-semibold text-primary hover:text-accent"
            >
              Go to Employer Login
            </Link>
          </div>
        ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {formError ? (
            <p
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-600"
            >
              {formError}
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <AuthInput
              label="Company Name"
              autoComplete="organization"
              icon={<Building2 className="h-4 w-4" />}
              error={errors.companyName?.message}
              {...register("companyName")}
            />
            <AuthInput
              label="Recruiter Name"
              autoComplete="name"
              icon={<UserRound className="h-4 w-4" />}
              error={errors.recruiterName?.message}
              {...register("recruiterName")}
            />
            <AuthInput
              label="Official Email"
              type="email"
              autoComplete="email"
              icon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register("email")}
            />
            <AuthInput
              label="Mobile Number"
              type="tel"
              autoComplete="tel"
              icon={<Phone className="h-4 w-4" />}
              error={errors.phone?.message}
              {...register("phone")}
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
            <AuthSelect
              label="Company Size"
              icon={<Users className="h-4 w-4" />}
              options={COMPANY_SIZE_OPTIONS}
              error={errors.companySize?.message}
              {...register("companySize")}
            />
            <AuthSelect
              label="Industry"
              icon={<Building2 className="h-4 w-4" />}
              options={INDUSTRY_OPTIONS}
              error={errors.industry?.message}
              {...register("industry")}
            />
            <div className="md:col-span-2">
              <AuthInput
                label="Company Website"
                type="url"
                autoComplete="url"
                icon={<Globe className="h-4 w-4" />}
                error={errors.website?.message}
                {...register("website")}
              />
            </div>
          </div>

          <AuthCheckbox
            label={
              <>
                I agree to the{" "}
                <Link href="#" className="font-semibold text-primary hover:text-accent">
                  Terms and Conditions
                </Link>
              </>
            }
            checked={Boolean(terms)}
            onChange={(e) =>
              setValue("terms", e.target.checked, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            error={errors.terms?.message}
          />

          <div className="md:max-w-sm md:pt-1">
            <AuthButton loading={isSubmitting}>Create Employer Account</AuthButton>
          </div>
        </form>
        )}
      </AuthCard>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already registered?{" "}
        <Link
          href="/login/employer"
          className="rounded font-semibold text-primary transition hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          Employer Login
        </Link>
      </p>
    </GuestOnlyRoute>
  );
}
