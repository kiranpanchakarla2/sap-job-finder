"use client";

import { useCallback, useEffect, useState } from "react";
import {
  candidateCareerService,
  type CandidateCareerPageData,
} from "../services/candidateCareerService";
import type {
  CareerEducation,
  CareerExperience,
  CareerHighlight,
  CandidateResume,
} from "../types/resume.types";

type LoadState = "idle" | "loading" | "success" | "error";

export function useCandidateCareer() {
  const [data, setData] = useState<CandidateCareerPageData | null>(null);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    const result = await candidateCareerService.getCareerPageData();
    if (!result.success) {
      setData(null);
      setError(result.error);
      setStatus("error");
      return;
    }
    setData(result.data);
    setStatus("success");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const applyResumes = (resumes: CandidateResume[]) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            resumes,
            currentResumeId:
              resumes.find((item) => item.isCurrent)?.id ?? null,
            hasResume: resumes.length > 0,
          }
        : prev,
    );
  };

  return {
    data,
    isLoading: status === "loading" || status === "idle",
    isError: status === "error",
    error,
    mutating,
    reload: () => void load(),
    uploadResume: async (file: File) => {
      setMutating(true);
      const result = await candidateCareerService.uploadResume(file);
      setMutating(false);
      if (result.success) applyResumes(result.data);
      return result;
    },
    setCurrentResume: async (resumeId: string) => {
      setMutating(true);
      const result = await candidateCareerService.setCurrentResume(resumeId);
      setMutating(false);
      if (result.success) applyResumes(result.data);
      return result;
    },
    deleteResume: async (resumeId: string) => {
      setMutating(true);
      const result = await candidateCareerService.deleteResume(resumeId);
      setMutating(false);
      if (result.success) applyResumes(result.data);
      return result;
    },
    getSignedUrl: (resumeId: string) =>
      candidateCareerService.getResumeSignedUrl(resumeId),
    saveExperience: async (
      draft: Omit<CareerExperience, "id"> & { id?: string },
    ) => {
      setMutating(true);
      const result = draft.id
        ? await candidateCareerService.updateExperience(draft.id, draft)
        : await candidateCareerService.createExperience(draft);
      setMutating(false);
      if (result.success) {
        setData((prev) => (prev ? { ...prev, experience: result.data } : prev));
      }
      return result;
    },
    deleteExperience: async (id: string) => {
      setMutating(true);
      const result = await candidateCareerService.deleteExperience(id);
      setMutating(false);
      if (result.success) {
        setData((prev) => (prev ? { ...prev, experience: result.data } : prev));
      }
      return result;
    },
    saveEducation: async (
      draft: Omit<CareerEducation, "id"> & { id?: string },
    ) => {
      setMutating(true);
      const result = draft.id
        ? await candidateCareerService.updateEducation(draft.id, draft)
        : await candidateCareerService.createEducation(draft);
      setMutating(false);
      if (result.success) {
        setData((prev) => (prev ? { ...prev, education: result.data } : prev));
      }
      return result;
    },
    deleteEducation: async (id: string) => {
      setMutating(true);
      const result = await candidateCareerService.deleteEducation(id);
      setMutating(false);
      if (result.success) {
        setData((prev) => (prev ? { ...prev, education: result.data } : prev));
      }
      return result;
    },
    saveHighlights: async (highlights: CareerHighlight[]) => {
      setMutating(true);
      const result = await candidateCareerService.saveHighlights(highlights);
      setMutating(false);
      if (result.success) {
        setData((prev) =>
          prev ? { ...prev, careerHighlights: result.data } : prev,
        );
      }
      return result;
    },
  };
}
