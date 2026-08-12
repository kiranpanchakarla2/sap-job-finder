"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { Skeleton, SkeletonCard } from "@/components/dashboard/shared/Skeleton";
import { cloneCandidateProfile } from "../data/mockCandidateProfile";
import { useCandidateProfile } from "../hooks/useCandidateProfile";
import { calculateProfileCompletion } from "../lib/profileCompletion";
import {
  hasProfileErrors,
  validateCandidateProfile,
} from "../lib/validateProfile";
import { candidateProfileService } from "../services/candidateProfileService";
import type {
  CandidateCertification,
  CandidateProfileForm,
  ProfileFieldErrors,
} from "../types/profile.types";
import { CareerInformationSection } from "../components/CareerInformationSection";
import { CertificationModal } from "../components/CertificationModal";
import { CertificationSection } from "../components/CertificationSection";
import { JobPreferencesSection } from "../components/JobPreferencesSection";
import { OpenToWorkSection } from "../components/OpenToWorkSection";
import { PersonalInformationSection } from "../components/PersonalInformationSection";
import { ProfessionalSummarySection } from "../components/ProfessionalSummarySection";
import { ProfileCompletionCard } from "../components/ProfileCompletionCard";
import { ProfileFormActions } from "../components/ProfileFormActions";
import { ProfileHeader } from "../components/ProfileHeader";
import { SapExpertiseSection } from "../components/SapExpertiseSection";

function profilesEqual(
  a: CandidateProfileForm,
  b: CandidateProfileForm,
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function CandidateProfilePage() {
  const {
    profile: loadedProfile,
    isLoading,
    isError,
    error,
    saving,
    reload,
    save,
  } = useCandidateProfile();

  const [savedProfile, setSavedProfile] = useState<CandidateProfileForm | null>(
    null,
  );
  const [draftProfile, setDraftProfile] = useState<CandidateProfileForm | null>(
    null,
  );
  const [editing, setEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [touched, setTouched] = useState<
    Partial<Record<keyof ProfileFieldErrors, boolean>>
  >({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<CandidateCertification | null>(
    null,
  );

  useEffect(() => {
    if (!loadedProfile) return;
    setSavedProfile(cloneCandidateProfile(loadedProfile));
    if (!editing) {
      setDraftProfile(cloneCandidateProfile(loadedProfile));
    }
  }, [loadedProfile, editing]);

  const profile = editing ? draftProfile : savedProfile;
  const dirty =
    editing &&
    savedProfile &&
    draftProfile &&
    !profilesEqual(draftProfile, savedProfile);

  const completion = useMemo(
    () =>
      profile
        ? calculateProfileCompletion(profile)
        : {
            percent: 0,
            completedCount: 0,
            totalCount: 0,
            categories: [],
          },
    [profile],
  );

  const errors = useMemo(() => {
    if (!editing || !draftProfile) return {} as ProfileFieldErrors;
    return validateCandidateProfile(draftProfile);
  }, [editing, draftProfile]);

  const visibleTouched = useMemo(() => {
    if (submitAttempted) {
      return {
        firstName: true,
        lastName: true,
        currentJobTitle: true,
        currentLocation: true,
      };
    }
    return touched;
  }, [submitAttempted, touched]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-4" aria-busy="true">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-72 max-w-full" />
        </div>
        <p className="text-sm text-muted">Loading your profile...</p>
        <SkeletonCard className="h-36" />
        <SkeletonCard className="h-40" />
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  if (isError || !loadedProfile) {
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

  if (!profile || !savedProfile || !draftProfile) {
    return (
      <div className="mx-auto max-w-7xl space-y-4" aria-busy="true">
        <p className="text-sm text-muted">Loading your profile...</p>
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  const startEditing = () => {
    setDraftProfile(cloneCandidateProfile(savedProfile));
    setTouched({});
    setSubmitAttempted(false);
    setEditing(true);
  };

  const cancelEditing = () => {
    if (dirty) {
      const confirmed = window.confirm(
        "You have unsaved changes. Discard them?",
      );
      if (!confirmed) return;
    }
    setDraftProfile(cloneCandidateProfile(savedProfile));
    setTouched({});
    setSubmitAttempted(false);
    setEditing(false);
  };

  const saveChanges = async () => {
    const nextErrors = validateCandidateProfile(draftProfile);
    setSubmitAttempted(true);
    if (hasProfileErrors(nextErrors)) {
      toast.error("Please fix the highlighted fields before saving.");
      return;
    }

    const result = await save(draftProfile);
    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setSavedProfile(cloneCandidateProfile(result.data));
    setDraftProfile(cloneCandidateProfile(result.data));
    setEditing(false);
    setTouched({});
    setSubmitAttempted(false);
    toast.success("Profile changes saved successfully.");
  };

  const updateDraft = (
    updater: (prev: CandidateProfileForm) => CandidateProfileForm,
  ) => {
    setDraftProfile((prev) => (prev ? updater(prev) : prev));
  };

  const onBlurField = (field: keyof ProfileFieldErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const onPhotoSelected = async (file: File) => {
    setUploadingPhoto(true);
    const result = await candidateProfileService.uploadAvatar(file);
    setUploadingPhoto(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    updateDraft((prev) => ({ ...prev, photoUrl: result.data }));
    setSavedProfile((prev) =>
      prev ? { ...prev, photoUrl: result.data } : prev,
    );
    toast.success("Profile photo updated.");
  };

  const openAddCertification = () => {
    setEditingCert(null);
    setCertModalOpen(true);
  };

  const openEditCertification = (cert: CandidateCertification) => {
    setEditingCert(cert);
    setCertModalOpen(true);
  };

  const saveCertification = (
    draft: Omit<CandidateCertification, "id" | "status"> & { id?: string },
  ) => {
    const expired =
      draft.expiryDate &&
      !Number.isNaN(new Date(draft.expiryDate).getTime()) &&
      new Date(draft.expiryDate) < new Date();

    updateDraft((prev) => {
      if (draft.id) {
        return {
          ...prev,
          certifications: prev.certifications.map((cert) =>
            cert.id === draft.id
              ? {
                  ...cert,
                  ...draft,
                  status: expired ? "Expired" : "Active",
                }
              : cert,
          ),
        };
      }

      const next: CandidateCertification = {
        id: `temp-${Date.now()}`,
        name: draft.name,
        issuingOrganization: draft.issuingOrganization,
        certificationId: draft.certificationId,
        issueDate: draft.issueDate,
        expiryDate: draft.expiryDate,
        status: expired ? "Expired" : "Active",
      };

      return {
        ...prev,
        certifications: [...prev.certifications, next],
      };
    });

    setCertModalOpen(false);
    setEditingCert(null);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            My Profile
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Manage your professional information and preferences to get better
            SAP job matches.
          </p>
        </div>
        <ProfileFormActions
          editing={editing}
          saving={saving}
          onEdit={startEditing}
          onSave={() => void saveChanges()}
          onCancel={cancelEditing}
        />
      </header>

      <ProfileCompletionCard completion={completion} />

      <ProfileHeader
        profile={profile}
        completionPercent={completion.percent}
        editing={editing}
        uploadingPhoto={uploadingPhoto}
        onPhotoSelected={(file) => void onPhotoSelected(file)}
      />

      <OpenToWorkSection
        value={profile.openToWork}
        editing={editing}
        onChange={(openToWork) =>
          updateDraft((prev) => ({ ...prev, openToWork }))
        }
      />

      <PersonalInformationSection
        value={profile.personal}
        editing={editing}
        errors={errors}
        touched={visibleTouched}
        onBlurField={onBlurField}
        onChange={(personal) => updateDraft((prev) => ({ ...prev, personal }))}
      />

      <ProfessionalSummarySection
        value={profile.professionalSummary}
        editing={editing}
        onChange={(professionalSummary) =>
          updateDraft((prev) => ({ ...prev, professionalSummary }))
        }
      />

      <CareerInformationSection
        value={profile.career}
        editing={editing}
        errors={errors}
        touched={visibleTouched}
        onBlurField={onBlurField}
        onChange={(career) => updateDraft((prev) => ({ ...prev, career }))}
      />

      <SapExpertiseSection
        value={profile.sapExpertise}
        editing={editing}
        onChange={(sapExpertise) =>
          updateDraft((prev) => ({ ...prev, sapExpertise }))
        }
      />

      <CertificationSection
        certifications={profile.certifications}
        editing={editing}
        onAdd={openAddCertification}
        onEdit={openEditCertification}
        onRemove={(id) =>
          updateDraft((prev) => ({
            ...prev,
            certifications: prev.certifications.filter(
              (cert) => cert.id !== id,
            ),
          }))
        }
      />

      <JobPreferencesSection
        value={profile.preferences}
        editing={editing}
        onChange={(preferences) =>
          updateDraft((prev) => ({ ...prev, preferences }))
        }
      />

      {editing ? (
        <div className="sticky bottom-4 z-10 flex justify-end rounded-[var(--radius-card)] border border-border bg-card/95 p-3 shadow-lift backdrop-blur">
          <ProfileFormActions
            editing={editing}
            saving={saving}
            onEdit={startEditing}
            onSave={() => void saveChanges()}
            onCancel={cancelEditing}
          />
        </div>
      ) : null}

      <CertificationModal
        open={certModalOpen}
        initial={editingCert}
        onClose={() => {
          setCertModalOpen(false);
          setEditingCert(null);
        }}
        onSave={saveCertification}
      />
    </div>
  );
}
