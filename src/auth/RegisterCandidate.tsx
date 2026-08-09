"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, Lock, Mail, MapPin, Phone, UserRound } from "lucide-react";
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
  candidateRegisterSchema,
  type CandidateRegisterValues,
} from "@/lib/validations/sapjobsfinder-auth";
import { EXPERIENCE_OPTIONS, SAP_MODULE_OPTIONS } from "@/types/candidate";

export function RegisterCandidate() {
  const { registerCandidate } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CandidateRegisterValues>({
    resolver: zodResolver(candidateRegisterSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      location: "",
      terms: false,
    },
  });

  const terms = watch("terms");

  const onSubmit = async (values: CandidateRegisterValues) => {
    setFormError(null);
    const result = await registerCandidate({
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
    toast.success("Candidate account created");
    router.push("/candidate/dashboard");
  };

  return (
    <GuestOnlyRoute expectedRole="candidate">
      <div className="mb-6 text-center lg:mb-7">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-dark sm:text-[2rem]">
          Create Candidate Account
        </h1>
        <p className="mx-auto mt-2.5 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-[15px]">
          Find SAP jobs and grow your career with SAP Jobs Finder.
        </p>
      </div>

      <AuthCard className="sm:p-8 lg:p-10">
        {needsEmailConfirmation ? (
          <div className="space-y-4 text-center">
            <p className="text-sm leading-relaxed text-slate-600" role="status">
              Please check your email to verify your account.
            </p>
            <Link
              href="/login/candidate"
              className="inline-flex text-sm font-semibold text-primary hover:text-accent"
            >
              Go to Candidate Login
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
            <AuthInput
              label="Email"
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
              label="Years of Experience"
              icon={<Briefcase className="h-4 w-4" />}
              options={EXPERIENCE_OPTIONS}
              error={errors.experience?.message}
              {...register("experience")}
            />
            <AuthSelect
              label="SAP Module"
              icon={<Briefcase className="h-4 w-4" />}
              options={SAP_MODULE_OPTIONS}
              error={errors.sapModule?.message}
              {...register("sapModule")}
            />
            <div className="md:col-span-2">
              <AuthInput
                label="Current Location"
                autoComplete="address-level2"
                icon={<MapPin className="h-4 w-4" />}
                error={errors.location?.message}
                {...register("location")}
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
            <AuthButton loading={isSubmitting}>Create Candidate Account</AuthButton>
          </div>
        </form>
        )}
      </AuthCard>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link
          href="/login/candidate"
          className="rounded font-semibold text-primary transition hover:text-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          Candidate Login
        </Link>
      </p>
    </GuestOnlyRoute>
  );
}
