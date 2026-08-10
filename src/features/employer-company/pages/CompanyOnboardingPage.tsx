"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthSelect } from "@/components/auth/AuthSelect";
import { AuthTextarea } from "@/components/auth/AuthTextarea";
import { AuthButton } from "@/components/auth/AuthButton";
import { LoadingSpinner } from "@/components/dashboard/shared/LoadingSpinner";
import { useEmployerAuth } from "@/features/employer-auth";
import { COMPANY_SIZE_OPTIONS, INDUSTRY_OPTIONS } from "@/types/employer";
import { CompanyLogoUploader } from "../components/CompanyLogoUploader";
import { OnboardingLayout } from "../components/OnboardingLayout";
import { COUNTRY_OPTIONS, EMPLOYER_ROUTES, COMPANY_ABOUT_MAX_LENGTH } from "../constants";
import { useCompanySetupStatus } from "../hooks/useCompanySetupStatus";
import { companyService } from "../services/companyService";
import {
  companyDetailsSchema,
  companyInformationSchema,
  recruiterInformationSchema,
  type CompanyDetailsValues,
  type CompanyInformationValues,
  type RecruiterInformationValues,
} from "../lib/validation";

export function CompanyOnboardingPage() {
  const router = useRouter();
  const { employer } = useEmployerAuth();
  const { setupComplete, isChecking, refresh } = useCompanySetupStatus();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [companyInfo, setCompanyInfo] = useState<CompanyInformationValues>({
    companyName: "",
    logoUrl: null,
    website: "",
    industry: "",
    companySize: "11-50",
  });
  const [companyDetails, setCompanyDetails] = useState<CompanyDetailsValues>({
    country: "",
    state: "",
    city: "",
    address: "",
    about: "",
  });

  const step1Form = useForm<CompanyInformationValues>({
    resolver: zodResolver(companyInformationSchema),
    defaultValues: companyInfo,
  });

  const step2Form = useForm<CompanyDetailsValues>({
    resolver: zodResolver(companyDetailsSchema),
    defaultValues: companyDetails,
  });

  const step3Form = useForm<RecruiterInformationValues>({
    resolver: zodResolver(recruiterInformationSchema),
    defaultValues: {
      recruiterName: [employer?.firstName, employer?.lastName].filter(Boolean).join(" "),
      designation: employer?.jobTitle ?? "",
      workEmail: employer?.email ?? "",
      phone: "",
    },
  });

  useEffect(() => {
    if (!isChecking && setupComplete) {
      router.replace(EMPLOYER_ROUTES.dashboard);
    }
  }, [isChecking, setupComplete, router]);

  useEffect(() => {
    if (employer?.email) {
      step3Form.setValue("workEmail", employer.email);
    }
    if (employer?.firstName || employer?.lastName) {
      step3Form.setValue(
        "recruiterName",
        [employer.firstName, employer.lastName].filter(Boolean).join(" "),
      );
    }
  }, [employer, step3Form]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner label="Preparing company setup…" />
      </div>
    );
  }

  const onContinueStep1 = step1Form.handleSubmit((values) => {
    setCompanyInfo(values);
    setStep(2);
  });

  const onContinueStep2 = step2Form.handleSubmit((values) => {
    setCompanyDetails(values);
    setStep(3);
  });

  const onComplete = step3Form.handleSubmit(async (recruiter) => {
    if (!employer?.id || !employer.email) {
      toast.error("Unable to verify your employer session.");
      return;
    }

    setSubmitting(true);
    const result = await companyService.completeOnboarding(
      employer.id,
      {
        ...companyInfo,
        ...companyDetails,
        ...recruiter,
        workEmail: employer.email,
      },
      employer.email,
    );
    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    await refresh();
    toast.success("Company setup completed.");
    router.push(EMPLOYER_ROUTES.dashboard);
  });

  const aboutValue = step2Form.watch("about") ?? "";
  const logoUrl = step1Form.watch("logoUrl");

  return (
    <OnboardingLayout currentStep={step}>
      {step === 1 ? (
        <form onSubmit={onContinueStep1} className="space-y-4" noValidate>
          <AuthInput
            label="Company Name *"
            autoComplete="organization"
            error={step1Form.formState.errors.companyName?.message}
            {...step1Form.register("companyName")}
          />

          <div className="rounded-2xl border border-border bg-surface/50 p-4">
            <CompanyLogoUploader
              value={logoUrl}
              employerId={employer?.id ?? ""}
              onChange={(url) => step1Form.setValue("logoUrl", url, { shouldDirty: true })}
              disabled={!employer?.id}
            />
          </div>

          <AuthInput
            label="Website"
            type="url"
            autoComplete="url"
            error={step1Form.formState.errors.website?.message}
            {...step1Form.register("website")}
          />

          <AuthSelect
            label="Industry *"
            options={INDUSTRY_OPTIONS}
            error={step1Form.formState.errors.industry?.message}
            {...step1Form.register("industry")}
          />

          <AuthSelect
            label="Company Size *"
            options={COMPANY_SIZE_OPTIONS}
            error={step1Form.formState.errors.companySize?.message}
            {...step1Form.register("companySize")}
          />

          <div className="pt-2">
            <AuthButton type="submit">Continue</AuthButton>
          </div>
        </form>
      ) : null}

      {step === 2 ? (
        <form onSubmit={onContinueStep2} className="space-y-4" noValidate>
          <AuthSelect
            label="Country *"
            options={[...COUNTRY_OPTIONS]}
            error={step2Form.formState.errors.country?.message}
            {...step2Form.register("country")}
          />

          <AuthInput
            label="State / Province"
            error={step2Form.formState.errors.state?.message}
            {...step2Form.register("state")}
          />

          <AuthInput
            label="City *"
            error={step2Form.formState.errors.city?.message}
            {...step2Form.register("city")}
          />

          <AuthInput
            label="Address"
            error={step2Form.formState.errors.address?.message}
            {...step2Form.register("address")}
          />

          <div>
            <AuthTextarea
              label="About Company *"
              rows={5}
              maxLength={COMPANY_ABOUT_MAX_LENGTH}
              error={step2Form.formState.errors.about?.message}
              {...step2Form.register("about")}
            />
            <p className="mt-2 text-right text-xs text-muted" aria-live="polite">
              {aboutValue.length} / {COMPANY_ABOUT_MAX_LENGTH}
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
            <AuthButton type="button" variant="secondary" onClick={() => setStep(1)}>
              Back
            </AuthButton>
            <AuthButton type="submit">Continue</AuthButton>
          </div>
        </form>
      ) : null}

      {step === 3 ? (
        <form onSubmit={onComplete} className="space-y-4" noValidate>
          <AuthInput
            label="Recruiter Name *"
            autoComplete="name"
            error={step3Form.formState.errors.recruiterName?.message}
            {...step3Form.register("recruiterName")}
          />

          <AuthInput
            label="Designation *"
            error={step3Form.formState.errors.designation?.message}
            {...step3Form.register("designation")}
          />

          <AuthInput
            label="Work Email *"
            type="email"
            autoComplete="email"
            readOnly
            error={step3Form.formState.errors.workEmail?.message}
            {...step3Form.register("workEmail")}
          />
          <p className="text-xs text-muted">
            Work email is locked to your signed-in employer account.
          </p>

          <AuthInput
            label="Phone Number"
            type="tel"
            autoComplete="tel"
            error={step3Form.formState.errors.phone?.message}
            {...step3Form.register("phone")}
          />

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
            <AuthButton
              type="button"
              variant="secondary"
              onClick={() => setStep(2)}
              disabled={submitting}
            >
              Back
            </AuthButton>
            <AuthButton type="submit" loading={submitting}>
              Complete Setup
            </AuthButton>
          </div>
        </form>
      ) : null}
    </OnboardingLayout>
  );
}
