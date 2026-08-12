"use client";

import { useId, useRef } from "react";
import {
  Camera,
  Loader2,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/dashboard/shared/StatusBadge";
import type { CandidateProfileForm } from "../types/profile.types";

export function ProfileHeader({
  profile,
  completionPercent,
  editing,
  uploadingPhoto = false,
  onPhotoSelected,
}: {
  profile: CandidateProfileForm;
  completionPercent: number;
  editing: boolean;
  uploadingPhoto?: boolean;
  onPhotoSelected: (file: File) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const fullName =
    [profile.personal.firstName, profile.personal.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || "Your profile";

  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex flex-col items-start gap-3 sm:items-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface sm:h-28 sm:w-28">
            {profile.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photoUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound className="text-muted" size={36} aria-hidden="true" />
            )}
          </div>
          {editing ? (
            <>
              <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                disabled={uploadingPhoto}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onPhotoSelected(file);
                  event.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="secondary"
                className="!px-3 !py-2 text-xs"
                disabled={uploadingPhoto}
                onClick={() => inputRef.current?.click()}
              >
                {uploadingPhoto ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Camera size={14} aria-hidden="true" />
                )}
                {uploadingPhoto ? "Uploading…" : "Change Photo"}
              </Button>
            </>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-text sm:text-2xl">
                {fullName}
              </h2>
              <p className="mt-1 text-sm font-medium text-primary">
                {profile.career.currentJobTitle || "Add your job title"}
              </p>
            </div>
            <StatusBadge tone={completionPercent >= 80 ? "success" : "info"}>
              {completionPercent}% complete
            </StatusBadge>
          </div>

          <dl className="grid gap-2 text-sm text-muted sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <MapPin size={15} className="shrink-0" aria-hidden="true" />
              <dt className="sr-only">Location</dt>
              <dd>{profile.personal.currentLocation || "Add location"}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={15} className="shrink-0" aria-hidden="true" />
              <dt className="sr-only">Email</dt>
              <dd className="truncate">{profile.personal.email}</dd>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Phone size={15} className="shrink-0" aria-hidden="true" />
              <dt className="sr-only">Phone</dt>
              <dd>{profile.personal.phone || "Add phone number"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
