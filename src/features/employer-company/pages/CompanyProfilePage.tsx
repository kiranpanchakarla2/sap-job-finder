"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  ExternalLink,
  Globe2,
  MapPin,
  Pencil,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthSelect } from "@/components/auth/AuthSelect";
import { AuthTextarea } from "@/components/auth/AuthTextarea";
import { AuthButton } from "@/components/auth/AuthButton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { Skeleton, SkeletonCard } from "@/components/dashboard/shared/Skeleton";
import { COMPANY_SIZE_OPTIONS, INDUSTRY_OPTIONS } from "@/types/employer";
import { CompanyLogoUploader } from "../components/CompanyLogoUploader";
import {
  COMPANY_ABOUT_MAX_LENGTH,
  COUNTRY_OPTIONS,
  EMPLOYER_ROUTES,
} from "../constants";
import { useCompanyProfile } from "../hooks/useCompanyProfile";
import {
  companyProfileEditSchema,
  type CompanyProfileEditValues,
} from "../lib/validation";
import type { CompanyProfile } from "../types/company.types";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-text">{value || "—"}</dd>
    </div>
  );
}

function CompanyHeaderCard({ profile }: { profile: CompanyProfile }) {
  const location = [profile.city, profile.state, profile.country].filter(Boolean).join(", ");

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface">
            {profile.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.logoUrl}
                alt={`${profile.companyName} logo`}
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 className="text-muted" size={24} aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-text">{profile.companyName}</h2>
            <p className="mt-1 text-sm text-muted">{profile.industry}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              {location ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={13} aria-hidden="true" />
                  {location}
                </span>
              ) : null}
              {profile.website ? (
                <a
                  href={
                    profile.website.startsWith("http")
                      ? profile.website
                      : `https://${profile.website}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-accent"
                >
                  <Globe2 size={13} aria-hidden="true" />
                  Website
                  <ExternalLink size={11} aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CompanyProfilePage() {
  const { profile, isLoading, isError, error, saving, hasProfile, reload, save } =
    useCompanyProfile();
  const [editing, setEditing] = useState(false);

  const form = useForm<CompanyProfileEditValues>({
    resolver: zodResolver(companyProfileEditSchema),
  });

  useEffect(() => {
    if (!profile) return;
    form.reset({
      companyName: profile.companyName,
      logoUrl: profile.logoUrl,
      website: profile.website,
      industry: profile.industry,
      companySize: profile.companySize || "11-50",
      country: profile.country,
      state: profile.state,
      city: profile.city,
      address: profile.address,
      about: profile.about,
      recruiterName: profile.recruiterName,
      designation: profile.designation,
      workEmail: profile.workEmail,
      phone: profile.phone,
    });
  }, [profile, form]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <SkeletonCard className="h-36" />
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Unable to load company information."
        description={error ?? undefined}
        onRetry={() => void reload()}
      />
    );
  }

  if (!hasProfile || !profile) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          icon={Building2}
          title="Complete your company profile"
          description="Add your company information so candidates can learn more about your organization."
          action={
            <Button href={EMPLOYER_ROUTES.onboarding}>Complete Company Profile</Button>
          }
        />
      </div>
    );
  }

  const onSave = form.handleSubmit(async (values) => {
    const result = await save({
      companyName: values.companyName,
      logoUrl: values.logoUrl,
      website: values.website,
      industry: values.industry,
      companySize: values.companySize,
      country: values.country,
      state: values.state,
      city: values.city,
      address: values.address,
      about: values.about,
      recruiterName: values.recruiterName,
      designation: values.designation,
      phone: values.phone,
    });

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Company profile saved successfully.");
    setEditing(false);
  });

  const aboutLength = form.watch("about")?.length ?? 0;
  const logoUrl = form.watch("logoUrl");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Company Profile</h1>
          <p className="mt-1 text-sm text-muted">
            Manage the information candidates see about your company.
          </p>
        </div>
        {!editing ? (
          <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
            <Pencil size={15} aria-hidden="true" />
            Edit Profile
          </Button>
        ) : null}
      </div>

      {!editing ? (
        <>
          <CompanyHeaderCard profile={profile} />

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
              <h3 className="text-base font-semibold text-text">Company Information</h3>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Company Name" value={profile.companyName} />
                <Field label="Industry" value={profile.industry} />
                <Field label="Company Size" value={profile.companySize} />
                <Field label="Website" value={profile.website} />
              </dl>
            </section>

            <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
              <h3 className="text-base font-semibold text-text">Location</h3>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Country" value={profile.country} />
                <Field label="State" value={profile.state} />
                <Field label="City" value={profile.city} />
                <Field label="Address" value={profile.address} />
              </dl>
            </section>

            <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft lg:col-span-2">
              <h3 className="text-base font-semibold text-text">Company Description</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text">
                {profile.about}
              </p>
            </section>

            <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft lg:col-span-2">
              <div className="flex items-center gap-2">
                <UserRound size={16} className="text-primary" aria-hidden="true" />
                <h3 className="text-base font-semibold text-text">Recruiter Information</h3>
              </div>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Name" value={profile.recruiterName} />
                <Field label="Designation" value={profile.designation} />
                <Field label="Email" value={profile.workEmail} />
                <Field label="Phone" value={profile.phone} />
              </dl>
            </section>
          </div>
        </>
      ) : (
        <form
          onSubmit={onSave}
          className="space-y-5 rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft sm:p-6"
          noValidate
        >
          <div className="rounded-2xl border border-border bg-surface/50 p-4">
            <CompanyLogoUploader
              value={logoUrl}
              employerId={profile.employerId}
              onChange={(url) => form.setValue("logoUrl", url, { shouldDirty: true })}
              disabled={saving}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <AuthInput
              label="Company Name *"
              error={form.formState.errors.companyName?.message}
              {...form.register("companyName")}
            />
            <AuthInput
              label="Website"
              error={form.formState.errors.website?.message}
              {...form.register("website")}
            />
            <AuthSelect
              label="Industry *"
              options={INDUSTRY_OPTIONS}
              error={form.formState.errors.industry?.message}
              {...form.register("industry")}
            />
            <AuthSelect
              label="Company Size *"
              options={COMPANY_SIZE_OPTIONS}
              error={form.formState.errors.companySize?.message}
              {...form.register("companySize")}
            />
            <AuthSelect
              label="Country *"
              options={[...COUNTRY_OPTIONS]}
              error={form.formState.errors.country?.message}
              {...form.register("country")}
            />
            <AuthInput
              label="State / Province"
              error={form.formState.errors.state?.message}
              {...form.register("state")}
            />
            <AuthInput
              label="City *"
              error={form.formState.errors.city?.message}
              {...form.register("city")}
            />
            <AuthInput
              label="Address"
              error={form.formState.errors.address?.message}
              {...form.register("address")}
            />
          </div>

          <div>
            <AuthTextarea
              label="About Company *"
              rows={5}
              maxLength={COMPANY_ABOUT_MAX_LENGTH}
              error={form.formState.errors.about?.message}
              {...form.register("about")}
            />
            <p className="mt-2 text-right text-xs text-muted">
              {aboutLength} / {COMPANY_ABOUT_MAX_LENGTH}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <AuthInput
              label="Recruiter Name *"
              error={form.formState.errors.recruiterName?.message}
              {...form.register("recruiterName")}
            />
            <AuthInput
              label="Designation *"
              error={form.formState.errors.designation?.message}
              {...form.register("designation")}
            />
            <AuthInput
              label="Work Email *"
              readOnly
              error={form.formState.errors.workEmail?.message}
              {...form.register("workEmail")}
            />
            <AuthInput
              label="Phone Number"
              error={form.formState.errors.phone?.message}
              {...form.register("phone")}
            />
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <AuthButton
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => {
                setEditing(false);
                form.reset();
              }}
            >
              Cancel
            </AuthButton>
            <AuthButton type="submit" loading={saving} loadingLabel="Saving…">
              Save Changes
            </AuthButton>
          </div>
        </form>
      )}

      {!editing && !hasProfile ? (
        <p className="text-sm text-muted">
          Need to start over?{" "}
          <Link href={EMPLOYER_ROUTES.onboarding} className="font-semibold text-primary">
            Open company setup
          </Link>
        </p>
      ) : null}
    </div>
  );
}
