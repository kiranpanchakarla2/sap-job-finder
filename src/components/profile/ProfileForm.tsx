"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
  personalProfileSchema,
  candidateDetailsSchema,
  type PersonalProfileValues,
  type CandidateDetailsValues,
} from "@/lib/validations/profile";
import {
  updateCandidateProfile,
  updateProfile,
  type CandidateProfileRow,
  type ProfileRow,
} from "@/services/profileService";
import { tryGetSupabaseEnv } from "@/lib/supabase/env";

const tabs = [
  "personal",
  "experience",
  "education",
  "skills",
  "certifications",
  "resume",
] as const;

type Tab = (typeof tabs)[number];

export function ProfileForm({
  userId,
  profile,
  candidate,
  resumeFilename,
  initialTab = "personal",
}: {
  userId: string;
  profile: ProfileRow | null;
  candidate: CandidateProfileRow | null;
  resumeFilename?: string | null;
  initialTab?: string;
}) {
  const [tab, setTab] = useState<Tab>(
    tabs.includes(initialTab as Tab) ? (initialTab as Tab) : "personal",
  );
  const [resumeName, setResumeName] = useState(resumeFilename ?? "");
  const [uploading, setUploading] = useState(false);

  const personalForm = useForm<PersonalProfileValues>({
    resolver: zodResolver(personalProfileSchema),
    defaultValues: {
      fullName: [profile?.first_name, profile?.last_name].filter(Boolean).join(" "),
      phone: profile?.phone ?? candidate?.phone ?? "",
      location: candidate?.current_city ?? "",
      headline: candidate?.headline ?? "",
    },
  });

  const detailsForm = useForm<CandidateDetailsValues>({
    resolver: zodResolver(candidateDetailsSchema),
    defaultValues: {
      experienceYears:
        candidate?.years_of_experience != null
          ? String(candidate.years_of_experience)
          : "",
      skills: "",
      education: "",
      certifications: "",
      summary: candidate?.about_me ?? "",
    },
  });

  const labels = useMemo(
    () => ({
      personal: "Personal",
      experience: "Experience",
      education: "Education",
      skills: "Skills",
      certifications: "Certifications",
      resume: "Resume",
    }),
    [],
  );

  const savePersonal = personalForm.handleSubmit(async (values) => {
    if (!tryGetSupabaseEnv()) {
      toast.message("Demo mode — connect Supabase to save profile");
      return;
    }
    const parts = values.fullName.trim().split(/\s+/);
    const first_name = parts[0] || "";
    const last_name = parts.slice(1).join(" ") || null;
    const [{ error: profileError }, { error: candidateError }] = await Promise.all([
      updateProfile(userId, {
        first_name,
        last_name,
        phone: values.phone,
      }),
      updateCandidateProfile(userId, {
        first_name,
        last_name,
        phone: values.phone,
        current_city: values.location,
        headline: values.headline,
      }),
    ]);
    if (profileError || candidateError) {
      toast.error(profileError?.message || candidateError?.message || "Unable to save");
    } else {
      toast.success("Personal details saved");
    }
  });

  const saveDetails = detailsForm.handleSubmit(async (values) => {
    if (!tryGetSupabaseEnv()) {
      toast.message("Demo mode — connect Supabase to save profile");
      return;
    }
    const years =
      values.experienceYears && values.experienceYears.trim() !== ""
        ? Number(values.experienceYears)
        : undefined;
    const { error } = await updateCandidateProfile(userId, {
      years_of_experience: Number.isFinite(years) ? years : undefined,
      about_me: values.summary || null,
    });
    if (error) toast.error(error.message);
    else toast.success("Profile details saved");
  });

  const onResume = async (file: File | undefined) => {
    if (!file) return;
    setResumeName(file.name);
    toast.message("Resume storage will be enabled once Supabase Storage buckets are configured.");
    setUploading(false);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              tab === t
                ? "bg-primary text-button-fg"
                : "bg-surface text-muted hover:text-text"
            }`}
          >
            {labels[t]}
          </button>
        ))}
      </div>

      {tab === "personal" ? (
        <form onSubmit={savePersonal} className="mt-6 grid max-w-xl gap-4">
          {(
            [
              ["fullName", "Full name"],
              ["phone", "Phone"],
              ["location", "Location"],
              ["headline", "Headline"],
            ] as const
          ).map(([name, label]) => (
            <label key={name} className="grid gap-1.5 text-sm">
              <span className="font-medium text-text">{label}</span>
              <input
                {...personalForm.register(name)}
                className="rounded-[var(--radius-control)] border border-border bg-card px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
              />
              {personalForm.formState.errors[name] ? (
                <span className="text-xs text-error">
                  {personalForm.formState.errors[name]?.message}
                </span>
              ) : null}
            </label>
          ))}
          <Button type="submit" className="w-fit">
            Save personal
          </Button>
        </form>
      ) : null}

      {tab === "experience" || tab === "education" || tab === "skills" || tab === "certifications" ? (
        <form onSubmit={saveDetails} className="mt-6 grid max-w-xl gap-4">
          {tab === "experience" ? (
            <>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-text">Years of experience</span>
                <input
                  type="number"
                  min={0}
                  {...detailsForm.register("experienceYears")}
                  className="rounded-[var(--radius-control)] border border-border bg-card px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-text">Summary</span>
                <textarea
                  rows={5}
                  {...detailsForm.register("summary")}
                  className="rounded-[var(--radius-control)] border border-border bg-card px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </>
          ) : null}
          {tab === "skills" ? (
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-text">Skills (comma separated)</span>
              <input
                {...detailsForm.register("skills")}
                placeholder="SAP Commerce, ABAP, Fiori"
                className="rounded-[var(--radius-control)] border border-border bg-card px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
          ) : null}
          {tab === "education" ? (
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-text">Education</span>
              <textarea
                rows={5}
                {...detailsForm.register("education")}
                placeholder="B.Tech CSE — Anna University (2018)"
                className="rounded-[var(--radius-control)] border border-border bg-card px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
          ) : null}
          {tab === "certifications" ? (
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-text">Certifications</span>
              <textarea
                rows={5}
                {...detailsForm.register("certifications")}
                placeholder="SAP Certified Development Associate — ABAP"
                className="rounded-[var(--radius-control)] border border-border bg-card px-3 py-2.5 outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
          ) : null}
          <Button type="submit" className="w-fit">
            Save
          </Button>
        </form>
      ) : null}

      {tab === "resume" ? (
        <div className="mt-6 max-w-xl rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
          <p className="text-sm text-muted">
            Upload a PDF resume (max ~5MB). Stored in the private Supabase{" "}
            <code className="text-xs">resumes</code> bucket.
          </p>
          {resumeName ? (
            <p className="mt-3 text-sm font-medium text-text">Current: {resumeName}</p>
          ) : (
            <p className="mt-3 text-sm text-muted">No resume uploaded yet.</p>
          )}
          <label className="mt-4 inline-flex cursor-pointer">
            <span className="rounded-[var(--radius-button)] bg-primary px-4 py-2.5 text-sm font-semibold text-button-fg">
              {uploading ? "Uploading…" : "Upload resume"}
            </span>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              disabled={uploading}
              onChange={(e) => onResume(e.target.files?.[0])}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
