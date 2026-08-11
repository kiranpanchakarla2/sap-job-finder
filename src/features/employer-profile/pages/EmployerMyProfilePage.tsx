"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlus, Loader2, Pencil, Trash2, Upload, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { Skeleton, SkeletonCard } from "@/components/dashboard/shared/Skeleton";
import { useAuth } from "@/auth/AuthContext";
import { employerProfileService } from "../services/employerProfileService";
import { useEmployerPersonalProfile } from "../hooks/useEmployerPersonalProfile";

const schema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  phone: z.string().trim().max(40, "Phone is too long"),
  jobTitle: z.string().trim().max(120, "Job title is too long"),
});

type FormValues = z.infer<typeof schema>;

function AvatarUploader({
  userId,
  value,
  onChange,
  disabled,
}: {
  userId: string;
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onPick = async (file: File | undefined) => {
    if (!file || disabled) return;
    setUploading(true);
    const result = await employerProfileService.uploadAvatar(userId, file);
    setUploading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    onChange(result.data);
    toast.success("Profile photo updated.");
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <UserRound className="text-muted" size={28} aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm font-medium text-text">Profile photo</p>
        <p className="text-xs text-muted">PNG or JPG up to 2 MB.</p>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            disabled={disabled || uploading}
            onChange={(event) => void onPick(event.target.files?.[0])}
          />
          <Button
            type="button"
            variant="secondary"
            className="!px-3 !py-2 text-xs"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {uploading ? "Uploading…" : "Upload photo"}
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              className="!px-3 !py-2 text-xs"
              disabled={disabled || uploading}
              onClick={() => onChange(null)}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Remove
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function EmployerMyProfilePage() {
  const { refreshSession } = useAuth();
  const { profile, isLoading, isError, error, saving, reload, save } =
    useEmployerPersonalProfile();
  const [editing, setEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      jobTitle: "",
    },
  });

  useEffect(() => {
    if (!profile) return;
    form.reset({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      jobTitle: profile.jobTitle,
    });
    setAvatarUrl(profile.avatarUrl);
  }, [profile, form]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72 max-w-full" />
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <ErrorState
          title="Unable to load your profile"
          description={error ?? "Please try again."}
          onRetry={reload}
        />
      </div>
    );
  }

  const fullName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
    "Your profile";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">
            My Profile
          </h1>
          <p className="mt-1 text-sm text-muted">
            Your personal account details for SAP Jobs Finder.
          </p>
        </div>
        {!editing ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setEditing(true)}
          >
            <Pencil size={15} aria-hidden="true" />
            Edit profile
          </Button>
        ) : null}
      </header>

      <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft sm:p-6">
        {!editing ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface">
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImagePlus className="text-muted" size={22} aria-hidden="true" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text">{fullName}</h2>
                <p className="text-sm text-muted">{profile.email}</p>
                {profile.companyRole ? (
                  <p className="mt-1 text-xs text-muted">
                    {profile.companyRole}
                    {profile.companyName ? ` at ${profile.companyName}` : ""}
                  </p>
                ) : null}
              </div>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                  First name
                </dt>
                <dd className="mt-1 text-sm font-medium text-text">
                  {profile.firstName || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                  Last name
                </dt>
                <dd className="mt-1 text-sm font-medium text-text">
                  {profile.lastName || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                  Email
                </dt>
                <dd className="mt-1 text-sm font-medium text-text">{profile.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                  Phone
                </dt>
                <dd className="mt-1 text-sm font-medium text-text">
                  {profile.phone || "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                  Job title
                </dt>
                <dd className="mt-1 text-sm font-medium text-text">
                  {profile.jobTitle || "—"}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <form
            className="space-y-5"
            onSubmit={form.handleSubmit(async (values) => {
              const result = await save({
                ...values,
                avatarUrl,
              });
              if (!result.success) {
                toast.error(result.error);
                return;
              }
              await refreshSession();
              toast.success("Profile updated.");
              setEditing(false);
            })}
          >
            <AvatarUploader
              userId={profile.userId}
              value={avatarUrl}
              onChange={setAvatarUrl}
              disabled={saving}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <AuthInput
                label="First name *"
                error={form.formState.errors.firstName?.message}
                {...form.register("firstName")}
              />
              <AuthInput
                label="Last name *"
                error={form.formState.errors.lastName?.message}
                {...form.register("lastName")}
              />
            </div>

            <div>
              <AuthInput
                label="Email"
                type="email"
                value={profile.email}
                disabled
                readOnly
              />
              <p className="mt-2 px-1 text-xs text-muted">
                Email is managed by your sign-in account.
              </p>
            </div>

            <AuthInput
              label="Phone"
              error={form.formState.errors.phone?.message}
              {...form.register("phone")}
            />

            <AuthInput
              label="Job title"
              error={form.formState.errors.jobTitle?.message}
              {...form.register("jobTitle")}
            />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                disabled={saving}
                onClick={() => {
                  setEditing(false);
                  setAvatarUrl(profile.avatarUrl);
                  form.reset({
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    phone: profile.phone,
                    jobTitle: profile.jobTitle,
                  });
                }}
              >
                Cancel
              </Button>
              <AuthButton loading={saving} loadingLabel="Saving…">
                Save changes
              </AuthButton>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
