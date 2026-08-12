"use client";

import { useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { Skeleton, SkeletonCard } from "@/components/dashboard/shared/Skeleton";
import { calculateProfileCompletion } from "@/features/candidate-profile";
import type { CandidateProfileForm } from "@/features/candidate-profile/types/profile.types";
import { useCandidateCareer } from "../hooks/useCandidateCareer";
import type {
  CandidateResume,
  CareerEducation,
  CareerExperience,
} from "../types/resume.types";
import {
  ApplicationReadinessCard,
  ProfileStrengthCard,
} from "../components/ApplicationReadinessCard";
import { CareerHighlightsSection } from "../components/CareerHighlightsSection";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { CurrentResumeCard } from "../components/CurrentResumeCard";
import { EducationModal } from "../components/EducationModal";
import { EducationSection } from "../components/EducationSection";
import { ExperienceModal } from "../components/ExperienceModal";
import { ExperienceSection } from "../components/ExperienceSection";
import { ProfessionalSnapshot } from "../components/ProfessionalSnapshot";
import { ResumeCertificationsSection } from "../components/ResumeCertificationsSection";
import { ResumeEmptyState } from "../components/ResumeEmptyState";
import { ResumePreviewModal } from "../components/ResumePreviewModal";
import { ResumeScoreCard } from "../components/ResumeScoreCard";
import { ResumeUploadModal } from "../components/ResumeUploadModal";
import { ResumeVersionList } from "../components/ResumeVersionList";

type PendingDelete =
  | { type: "resume"; item: CandidateResume }
  | { type: "experience"; item: CareerExperience }
  | { type: "education"; item: CareerEducation }
  | { type: "highlight"; id: string }
  | null;

export function CandidateResumePage() {
  const career = useCandidateCareer();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewResume, setPreviewResume] = useState<CandidateResume | null>(
    null,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [experienceModalOpen, setExperienceModalOpen] = useState(false);
  const [editingExperience, setEditingExperience] =
    useState<CareerExperience | null>(null);
  const [educationModalOpen, setEducationModalOpen] = useState(false);
  const [editingEducation, setEditingEducation] =
    useState<CareerEducation | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const data = career.data;

  const currentResume =
    data?.resumes.find((resume) => resume.id === data.currentResumeId) ??
    data?.resumes.find((resume) => resume.isCurrent) ??
    null;

  const profileCompletion = useMemo(() => {
    if (!data) return 0;
    // Prefer stored value; also recompute lightly for readiness when resume exists
    if (data.profileCompletion > 0) return data.profileCompletion;
    const synthetic: CandidateProfileForm = {
      photoUrl: null,
      personal: {
        firstName: "A",
        lastName: "B",
        email: "a@b.com",
        phone: "1",
        dateOfBirth: "",
        gender: "",
        currentLocation: "x",
        preferredLocation: "",
      },
      professionalSummary: "",
      career: {
        currentJobTitle: "",
        currentCompany: "",
        totalExperience: "",
        relevantSapExperience: "",
        noticePeriod: "",
        expectedSalary: "",
        currentSalary: "",
        employmentStatus: "",
      },
      sapExpertise: {
        modules: data.sapModules,
        technicalSkills: data.technicalSkills,
        moduleExperience: [],
      },
      certifications: data.certifications,
      preferences: {
        preferredJobRoles: [],
        preferredSapModules: [],
        preferredLocations: [],
        workModes: [],
        employmentTypes: [],
        preferredSalaryRange: "",
        careerLevel: "",
      },
      openToWork: {
        enabled: false,
        preferredJobRoles: [],
        preferredLocations: [],
        preferredWorkModes: [],
        availability: "",
      },
      hasResume: data.hasResume,
    };
    return calculateProfileCompletion(synthetic).percent;
  }, [data]);

  const readinessItems = useMemo(() => {
    if (!data) return [];
    return [
      {
        id: "resume",
        label: "Resume added",
        complete: Boolean(currentResume),
      },
      {
        id: "profile",
        label: "Profile completed",
        complete: profileCompletion >= 70 || data.profileCompletion >= 70,
      },
      {
        id: "skills",
        label: "SAP skills added",
        complete: data.sapModules.length > 0 || data.technicalSkills.length > 0,
      },
      {
        id: "experience",
        label: "Experience added",
        complete: data.experience.length > 0,
      },
      {
        id: "certs",
        label: "Certifications added",
        complete: data.certifications.length > 0,
      },
    ];
  }, [data, currentResume, profileCompletion]);

  const strengthItems = readinessItems.map((item) => ({
    ...item,
    label:
      item.id === "resume"
        ? "Resume Added"
        : item.id === "skills"
          ? "SAP Skills"
          : item.id === "experience"
            ? "Experience"
            : item.id === "certs"
              ? "Certifications"
              : item.label,
  })).filter((item) => item.id !== "profile");

  if (career.isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72 max-w-full" />
        <p className="text-sm text-muted">Loading your resume...</p>
        <div className="grid gap-4 lg:grid-cols-3">
          <SkeletonCard className="h-40 lg:col-span-2" />
          <SkeletonCard className="h-40" />
        </div>
        <SkeletonCard className="h-48" />
      </div>
    );
  }

  if (career.isError || !data) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <ErrorState
          title="Unable to load your resume"
          description={career.error ?? "Please try again."}
          onRetry={career.reload}
        />
      </div>
    );
  }

  const openPreview = async (resume: CandidateResume) => {
    setPreviewResume(resume);
    setPreviewUrl(null);
    if (resume.fileType !== "PDF") return;
    const result = await career.getSignedUrl(resume.id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setPreviewUrl(result.data);
  };

  const handleDownload = async (resume: CandidateResume) => {
    const result = await career.getSignedUrl(resume.id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = result.data;
    anchor.download = resume.fileName;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.click();
    toast.success("Download started.");
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const pending = pendingDelete;
    setPendingDelete(null);

    if (pending.type === "resume") {
      const result = await career.deleteResume(pending.item.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Resume deleted.");
      return;
    }

    if (pending.type === "experience") {
      const result = await career.deleteExperience(pending.item.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Experience deleted.");
      return;
    }

    if (pending.type === "education") {
      const result = await career.deleteEducation(pending.item.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Education deleted.");
      return;
    }

    if (pending.type === "highlight") {
      const next = data.careerHighlights.filter(
        (item) => item.id !== pending.id,
      );
      const result = await career.saveHighlights(next);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Career highlight deleted.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Resume
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Manage your resumes and build a stronger career profile for SAP
            opportunities.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={() => setUploadOpen(true)}
        >
          <Upload size={15} aria-hidden="true" />
          Upload Resume
        </Button>
      </header>

      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {currentResume ? (
            <CurrentResumeCard
              resume={currentResume}
              onView={() => void openPreview(currentResume)}
              onDownload={() => void handleDownload(currentResume)}
              onReplace={() => setUploadOpen(true)}
            />
          ) : (
            <ResumeEmptyState onUpload={() => setUploadOpen(true)} />
          )}
        </div>
        <ResumeScoreCard insight={data.resumeScore} />
      </div>

      {data.resumes.length ? (
        <ResumeVersionList
          resumes={data.resumes}
          onView={(resume) => void openPreview(resume)}
          onDownload={(resume) => void handleDownload(resume)}
          onSetCurrent={async (resume) => {
            const result = await career.setCurrentResume(resume.id);
            if (!result.success) {
              toast.error(result.error);
              return;
            }
            toast.success("Resume set as current.");
          }}
          onDelete={(resume) =>
            setPendingDelete({ type: "resume", item: resume })
          }
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <ProfileStrengthCard
          profileCompletion={
            data.profileCompletion || profileCompletion
          }
          items={strengthItems}
        />
        <ApplicationReadinessCard items={readinessItems} />
      </div>

      <section id="career-profile" className="space-y-6 scroll-mt-6">
        <div>
          <h2 className="text-xl font-semibold text-text">Career Profile</h2>
          <p className="mt-1 text-sm text-muted">
            Add the experience and education that make your SAP career stand
            out.
          </p>
        </div>

        <ProfessionalSnapshot
          state={{
            resumes: data.resumes,
            currentResumeId: data.currentResumeId,
            experience: data.experience,
            education: data.education,
            careerHighlights: data.careerHighlights,
            resumeScore: data.resumeScore,
          }}
          sapSkills={[...data.sapModules, ...data.technicalSkills].slice(0, 6)}
          certificationCount={data.certifications.length}
          totalExperienceLabel={data.totalExperienceLabel}
          sapExperienceLabel={data.sapExperienceLabel}
        />

        <ExperienceSection
          experience={data.experience}
          onAdd={() => {
            setEditingExperience(null);
            setExperienceModalOpen(true);
          }}
          onEdit={(item) => {
            setEditingExperience(item);
            setExperienceModalOpen(true);
          }}
          onDelete={(item) =>
            setPendingDelete({ type: "experience", item })
          }
        />

        <EducationSection
          education={data.education}
          onAdd={() => {
            setEditingEducation(null);
            setEducationModalOpen(true);
          }}
          onEdit={(item) => {
            setEditingEducation(item);
            setEducationModalOpen(true);
          }}
          onDelete={(item) => setPendingDelete({ type: "education", item })}
        />

        <ResumeCertificationsSection
          certifications={data.certifications}
        />

        <CareerHighlightsSection
          highlights={data.careerHighlights}
          onChange={(careerHighlights) => {
            void (async () => {
              const result = await career.saveHighlights(careerHighlights);
              if (!result.success) {
                toast.error(result.error);
                career.reload();
              }
            })();
          }}
          onRequestDelete={(id) =>
            setPendingDelete({ type: "highlight", id })
          }
        />
      </section>

      <ResumeUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={async (file) => {
          const result = await career.uploadResume(file);
          if (!result.success) {
            return { success: false, error: result.error };
          }
          toast.success("Resume uploaded successfully.");
          return { success: true };
        }}
      />

      <ResumePreviewModal
        open={Boolean(previewResume)}
        resume={
          previewResume
            ? { ...previewResume, previewUrl }
            : null
        }
        onClose={() => {
          setPreviewResume(null);
          setPreviewUrl(null);
        }}
        onDownload={() => {
          if (previewResume) void handleDownload(previewResume);
        }}
      />

      <ExperienceModal
        open={experienceModalOpen}
        initial={editingExperience}
        onClose={() => {
          setExperienceModalOpen(false);
          setEditingExperience(null);
        }}
        onSave={async (draft) => {
          const result = await career.saveExperience(draft);
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          toast.success(
            draft.id
              ? "Experience updated successfully."
              : "Experience added successfully.",
          );
          setExperienceModalOpen(false);
          setEditingExperience(null);
        }}
      />

      <EducationModal
        open={educationModalOpen}
        initial={editingEducation}
        onClose={() => {
          setEducationModalOpen(false);
          setEditingEducation(null);
        }}
        onSave={async (draft) => {
          const result = await career.saveEducation(draft);
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          toast.success(
            draft.id
              ? "Education updated successfully."
              : "Education added successfully.",
          );
          setEducationModalOpen(false);
          setEditingEducation(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={
          pendingDelete?.type === "resume"
            ? "Delete this resume?"
            : pendingDelete?.type === "experience"
              ? "Delete this experience?"
              : pendingDelete?.type === "education"
                ? "Delete this education?"
                : "Delete this career highlight?"
        }
        description={
          pendingDelete?.type === "resume"
            ? "This resume will be removed from your resume library."
            : "This action cannot be undone."
        }
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
