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
  uploadResume,
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
      fullName: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      location: profile?.location ?? "",
      headline: profile?.headline ?? "",
    },
  });

  const detailsForm = useForm<CandidateDetailsValues>({
    resolver: zodResolver(candidateDetailsSchema),
    defaultValues: {
      experienceYears:
        candidate?.experience_years != null
          ? String(candidate.experience_years)
          : "",
      skills: (candidate?.skills ?? []).join(", "),
      education:
        typeof candidate?.education === "string"
          ? candidate.education
          : candidate?.education
            ? JSON.stringify(candidate.education)
            : "",
      certifications:
        typeof candidate?.certifications === "string"
          ? candidate.certifications
          : candidate?.certifications
            ? JSON.stringify(candidate.certifications)
            : "",
      summary: candidate?.summary ?? "",
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
    const { error } = await updateProfile(userId, {
      full_name: values.fullName,
      phone: values.phone,
      location: values.location,
      headline: values.headline,
    });
    if (error) toast.error(error.message);
    else toast.success("Personal details saved");
  });

  const saveDetails = detailsForm.handleSubmit(async (values) => {
    if (!tryGetSupabaseEnv()) {
      toast.message("Demo mode — connect Supabase to save profile");
      return;
    }
    const skills = values.skills
      ? values.skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const years =
      values.experienceYears && values.experienceYears.trim() !== ""
        ? Number(values.experienceYears)
        : undefined;
    const { error } = await updateCandidateProfile(userId, {
      experience_years: Number.isFinite(years) ? years : undefined,
      skills,
      education: values.education || null,
      certifications: values.certifications || null,
      summary: values.summary || null,
    });
    if (error) toast.error(error.message);
    else toast.success("Profile details saved");
  });

  const onResume = async (file: File | undefined) => {
    if (!file) return;
    if (!tryGetSupabaseEnv()) {
      toast.message("Demo mode — connect Supabase to upload resumes");
      setResumeName(file.name);
      return;
    }
    setUploading(true);
    const { error } = await uploadResume(userId, file);
    setUploading(false);
    if (error) toast.error(error.message);
    else {
      setResumeName(file.name);
      toast.success("Resume uploaded");
    }
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
