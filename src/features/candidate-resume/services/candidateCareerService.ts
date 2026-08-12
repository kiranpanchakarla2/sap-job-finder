import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types";
import {
  detectResumeFileType,
  validateResumeFile,
} from "../lib/resumeUtils";
import {
  educationToDb,
  experienceToDb,
  mapEducationRow,
  mapExperienceRow,
  mapHighlightRow,
  mapResumeRow,
  type EducationRow,
  type ExperienceRow,
  type HighlightRow,
  type ResumeRow,
} from "../lib/careerMappers";
import type {
  CareerEducation,
  CareerExperience,
  CareerHighlight,
  CandidateResume,
} from "../types/resume.types";
import { MOCK_RESUME_SCORE } from "../data/mockCandidateResume";
import type { CandidateCertification } from "@/features/candidate-profile/types/profile.types";
import { mapCertificationsFromRows } from "@/features/candidate-profile/lib/candidateProfileMapper";

const RESUME_BUCKET = "candidate-resumes";
const SIGNED_URL_TTL_SECONDS = 600;

export type CareerServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type CandidateCareerPageData = {
  candidateId: string;
  resumes: CandidateResume[];
  currentResumeId: string | null;
  experience: CareerExperience[];
  education: CareerEducation[];
  careerHighlights: CareerHighlight[];
  certifications: CandidateCertification[];
  sapModules: string[];
  technicalSkills: string[];
  totalExperienceLabel: string;
  sapExperienceLabel: string;
  profileCompletion: number;
  hasResume: boolean;
  resumeScore: typeof MOCK_RESUME_SCORE;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: unknown }).message ?? "").trim();
    if (message) {
      if (process.env.NODE_ENV === "development") {
        console.error("[candidateCareerService]", message, error);
      }
    }
  }
  return fallback;
}

async function getAuthContext() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return { supabase, user: null as null, candidate: null as null };
  }

  const { data: candidate } = await supabase
    .from("candidate_profiles")
    .select(
      "id, user_id, resume_url, resume_file_name, sap_skills, skills, experience_band, sap_experience_band, profile_completion, professional_summary, first_name, last_name",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  return { supabase, user, candidate };
}

async function ensureCandidate(
  supabase: ReturnType<typeof createClient>,
  user: { id: string; user_metadata?: Record<string, unknown> },
) {
  const existing = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing.data?.id) return { success: true as const, data: existing.data.id };

  const meta = user.user_metadata ?? {};
  const { data: created, error } = await supabase
    .from("candidate_profiles")
    .insert({
      user_id: user.id,
      first_name: typeof meta.first_name === "string" ? meta.first_name : null,
      last_name: typeof meta.last_name === "string" ? meta.last_name : null,
      phone: typeof meta.phone === "string" ? meta.phone : null,
      profile_completion: 0,
    })
    .select("id")
    .single();

  if (created?.id) return { success: true as const, data: created.id };

  const raced = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (raced.data?.id) return { success: true as const, data: raced.data.id };

  return {
    success: false as const,
    error: getErrorMessage(error, "Unable to load your candidate profile."),
  };
}

function extensionForFile(file: File): string {
  const type = detectResumeFileType(file.name);
  if (type === "DOC") return "doc";
  if (type === "DOCX") return "docx";
  return "pdf";
}

async function syncProfileResumeFields(
  supabase: ReturnType<typeof createClient>,
  candidateId: string,
  resume: ResumeRow | null,
) {
  await supabase
    .from("candidate_profiles")
    .update({
      resume_url: resume
        ? resume.storage_path || resume.resume_url
        : null,
      resume_file_name: resume
        ? resume.original_file_name || resume.resume_name
        : null,
    })
    .eq("id", candidateId);
}

async function syncExperienceJson(
  supabase: ReturnType<typeof createClient>,
  candidateId: string,
  rows: ExperienceRow[],
) {
  const payload = rows.map((row) => ({
    title: row.designation,
    company: row.company,
    location: row.location,
    employmentType: row.employment_type,
    startDate: row.start_date,
    endDate: row.end_date,
    currentlyWorking: row.currently_working,
    description: row.description,
  }));
  await supabase
    .from("candidate_profiles")
    .update({ work_experience: payload })
    .eq("id", candidateId);
}

async function syncEducationJson(
  supabase: ReturnType<typeof createClient>,
  candidateId: string,
  rows: EducationRow[],
) {
  const payload = rows.map((row) => ({
    degree: row.degree,
    fieldOfStudy: row.field_of_study,
    institution: row.college,
    location: row.location,
    startDate: row.start_date,
    endDate: row.end_date,
    grade: row.grade,
  }));
  await supabase
    .from("candidate_profiles")
    .update({ education: payload })
    .eq("id", candidateId);
}

export const candidateCareerService = {
  async getCareerPageData(): Promise<
    CareerServiceResult<CandidateCareerPageData>
  > {
    try {
      const { supabase, user } = await getAuthContext();
      if (!user) {
        return { success: false, error: "Unable to load your resume." };
      }

      const ensured = await ensureCandidate(supabase, user);
      if (!ensured.success) return ensured;
      const candidateId = ensured.data;

      const [
        resumesRes,
        experienceRes,
        educationRes,
        highlightsRes,
        certsRes,
        profileRes,
      ] = await Promise.all([
        supabase
          .from("candidate_resumes")
          .select("*")
          .eq("candidate_id", candidateId)
          .order("created_at", { ascending: false }),
        supabase
          .from("candidate_experience")
          .select("*")
          .eq("candidate_id", candidateId)
          .order("currently_working", { ascending: false })
          .order("start_date", { ascending: false }),
        supabase
          .from("candidate_education")
          .select("*")
          .eq("candidate_id", candidateId)
          .order("start_date", { ascending: false }),
        supabase
          .from("candidate_career_highlights")
          .select("*")
          .eq("candidate_id", candidateId)
          .order("display_order", { ascending: true }),
        supabase
          .from("candidate_certifications")
          .select("*")
          .eq("candidate_id", candidateId)
          .order("issued_date", { ascending: false }),
        supabase
          .from("candidate_profiles")
          .select(
            "sap_skills, skills, experience_band, sap_experience_band, profile_completion, resume_url",
          )
          .eq("id", candidateId)
          .maybeSingle(),
      ]);

      const resumeRows = (resumesRes.data ?? []) as ResumeRow[];
      const resumes = resumeRows.map(mapResumeRow);
      const current = resumes.find((item) => item.isCurrent) ?? null;

      return {
        success: true,
        data: {
          candidateId,
          resumes,
          currentResumeId: current?.id ?? null,
          experience: ((experienceRes.data ?? []) as ExperienceRow[]).map(
            mapExperienceRow,
          ),
          education: ((educationRes.data ?? []) as EducationRow[]).map(
            mapEducationRow,
          ),
          careerHighlights: ((highlightsRes.data ?? []) as HighlightRow[]).map(
            mapHighlightRow,
          ),
          certifications: mapCertificationsFromRows(certsRes.data ?? []),
          sapModules: profileRes.data?.sap_skills ?? [],
          technicalSkills: profileRes.data?.skills ?? [],
          totalExperienceLabel: profileRes.data?.experience_band
            ? `${profileRes.data.experience_band.replace(" years", "+ Years")} Experience`
            : "Experience",
          sapExperienceLabel: profileRes.data?.sap_experience_band
            ? `${profileRes.data.sap_experience_band.replace(" years", "+ Years")} SAP Experience`
            : "SAP Experience",
          profileCompletion: profileRes.data?.profile_completion ?? 0,
          hasResume: resumes.length > 0 || Boolean(profileRes.data?.resume_url),
          resumeScore: { ...MOCK_RESUME_SCORE },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Unable to load your resume."),
      };
    }
  },

  async uploadResume(
    file: File,
  ): Promise<CareerServiceResult<CandidateResume[]>> {
    try {
      const validationError = validateResumeFile(file);
      if (validationError) {
        return { success: false, error: validationError };
      }

      const allowedMimes = new Set([
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]);
      if (file.type && !allowedMimes.has(file.type)) {
        return {
          success: false,
          error: "Please upload a PDF, DOC, or DOCX file.",
        };
      }

      const { supabase, user } = await getAuthContext();
      if (!user) {
        return {
          success: false,
          error: "We couldn't upload your resume. Please try again.",
        };
      }

      const ensured = await ensureCandidate(supabase, user);
      if (!ensured.success) return ensured;
      const candidateId = ensured.data;

      const { count } = await supabase
        .from("candidate_resumes")
        .select("id", { count: "exact", head: true })
        .eq("candidate_id", candidateId);

      const resumeId = crypto.randomUUID();
      const ext = extensionForFile(file);
      const storagePath = `${user.id}/${resumeId}/resume.${ext}`;
      const fileType = detectResumeFileType(file.name) ?? "PDF";

      const { error: uploadError } = await supabase.storage
        .from(RESUME_BUCKET)
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        });

      if (uploadError) {
        return {
          success: false,
          error: getErrorMessage(
            uploadError,
            "We couldn't upload your resume. Please try again.",
          ),
        };
      }

      const { data: inserted, error: insertError } = await supabase
        .from("candidate_resumes")
        .insert({
          id: resumeId,
          candidate_id: candidateId,
          resume_name: file.name,
          original_file_name: file.name,
          resume_url: storagePath,
          storage_path: storagePath,
          file_size: file.size,
          mime_type: file.type || null,
          file_type: fileType,
          version_number: (count ?? 0) + 1,
          is_primary: false,
        })
        .select("*")
        .single();

      if (insertError || !inserted) {
        await supabase.storage.from(RESUME_BUCKET).remove([storagePath]);
        return {
          success: false,
          error: getErrorMessage(
            insertError,
            "We couldn't upload your resume. Please try again.",
          ),
        };
      }

      const { error: primaryError } = await supabase.rpc(
        "set_candidate_resume_primary",
        { p_resume_id: resumeId },
      );

      if (primaryError) {
        // Still keep the uploaded file; mark primary manually as fallback
        await supabase
          .from("candidate_resumes")
          .update({ is_primary: false })
          .eq("candidate_id", candidateId);
        await supabase
          .from("candidate_resumes")
          .update({ is_primary: true })
          .eq("id", resumeId);
        await syncProfileResumeFields(supabase, candidateId, {
          ...inserted,
          is_primary: true,
        });
      }

      return this.listResumes();
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(
          error,
          "We couldn't upload your resume. Please try again.",
        ),
      };
    }
  },

  async listResumes(): Promise<CareerServiceResult<CandidateResume[]>> {
    const page = await this.getCareerPageData();
    if (!page.success) return page;
    return { success: true, data: page.data.resumes };
  },

  async setCurrentResume(
    resumeId: string,
  ): Promise<CareerServiceResult<CandidateResume[]>> {
    try {
      const { supabase, user } = await getAuthContext();
      if (!user) {
        return { success: false, error: "Unable to update current resume." };
      }

      const { error } = await supabase.rpc("set_candidate_resume_primary", {
        p_resume_id: resumeId,
      });

      if (error) {
        return {
          success: false,
          error: getErrorMessage(error, "Unable to update current resume."),
        };
      }

      return this.listResumes();
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Unable to update current resume."),
      };
    }
  },

  async deleteResume(
    resumeId: string,
  ): Promise<CareerServiceResult<CandidateResume[]>> {
    try {
      const { supabase, user } = await getAuthContext();
      if (!user) {
        return {
          success: false,
          error: "We couldn't delete your resume. Please try again.",
        };
      }

      const ensured = await ensureCandidate(supabase, user);
      if (!ensured.success) return ensured;
      const candidateId = ensured.data;

      const { data: row, error: fetchError } = await supabase
        .from("candidate_resumes")
        .select("*")
        .eq("id", resumeId)
        .eq("candidate_id", candidateId)
        .maybeSingle();

      if (fetchError || !row) {
        return {
          success: false,
          error: "We couldn't delete your resume. Please try again.",
        };
      }

      const path = row.storage_path || row.resume_url;
      const wasPrimary = row.is_primary;

      const { error: deleteError } = await supabase
        .from("candidate_resumes")
        .delete()
        .eq("id", resumeId)
        .eq("candidate_id", candidateId);

      if (deleteError) {
        return {
          success: false,
          error: getErrorMessage(
            deleteError,
            "We couldn't delete your resume. Please try again.",
          ),
        };
      }

      if (path && !path.startsWith("http")) {
        await supabase.storage.from(RESUME_BUCKET).remove([path]);
      }

      if (wasPrimary) {
        const { data: next } = await supabase
          .from("candidate_resumes")
          .select("id")
          .eq("candidate_id", candidateId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (next?.id) {
          await supabase.rpc("set_candidate_resume_primary", {
            p_resume_id: next.id,
          });
        } else {
          await syncProfileResumeFields(supabase, candidateId, null);
        }
      }

      return this.listResumes();
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(
          error,
          "We couldn't delete your resume. Please try again.",
        ),
      };
    }
  },

  async getResumeSignedUrl(
    resumeId: string,
  ): Promise<CareerServiceResult<string>> {
    try {
      const { supabase, user } = await getAuthContext();
      if (!user) {
        return { success: false, error: "Unable to open this resume." };
      }

      const ensured = await ensureCandidate(supabase, user);
      if (!ensured.success) return ensured;

      const { data: row, error } = await supabase
        .from("candidate_resumes")
        .select("storage_path, resume_url")
        .eq("id", resumeId)
        .eq("candidate_id", ensured.data)
        .maybeSingle();

      if (error || !row) {
        return { success: false, error: "Unable to open this resume." };
      }

      const path = row.storage_path || row.resume_url;
      if (!path || path.startsWith("http")) {
        return { success: false, error: "Unable to open this resume." };
      }

      const { data, error: signedError } = await supabase.storage
        .from(RESUME_BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

      if (signedError || !data?.signedUrl) {
        return {
          success: false,
          error: getErrorMessage(signedError, "Unable to open this resume."),
        };
      }

      return { success: true, data: data.signedUrl };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Unable to open this resume."),
      };
    }
  },

  async createExperience(
    input: Omit<CareerExperience, "id">,
  ): Promise<CareerServiceResult<CareerExperience[]>> {
    return this.mutateExperience("create", input);
  },

  async updateExperience(
    id: string,
    input: Omit<CareerExperience, "id">,
  ): Promise<CareerServiceResult<CareerExperience[]>> {
    return this.mutateExperience("update", input, id);
  },

  async deleteExperience(
    id: string,
  ): Promise<CareerServiceResult<CareerExperience[]>> {
    try {
      const { supabase, user } = await getAuthContext();
      if (!user) return { success: false, error: "Unable to delete experience." };
      const ensured = await ensureCandidate(supabase, user);
      if (!ensured.success) return ensured;

      const { error } = await supabase
        .from("candidate_experience")
        .delete()
        .eq("id", id)
        .eq("candidate_id", ensured.data);

      if (error) {
        return {
          success: false,
          error: getErrorMessage(error, "Unable to delete experience."),
        };
      }

      return this.listExperience(ensured.data);
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Unable to delete experience."),
      };
    }
  },

  async mutateExperience(
    mode: "create" | "update",
    input: Omit<CareerExperience, "id">,
    id?: string,
  ): Promise<CareerServiceResult<CareerExperience[]>> {
    try {
      const { supabase, user } = await getAuthContext();
      if (!user) return { success: false, error: "Unable to save experience." };
      const ensured = await ensureCandidate(supabase, user);
      if (!ensured.success) return ensured;

      const payload = experienceToDb(input);

      if (mode === "create") {
        const { error } = await supabase.from("candidate_experience").insert({
          candidate_id: ensured.data,
          ...payload,
        });
        if (error) {
          return {
            success: false,
            error: getErrorMessage(error, "Unable to save experience."),
          };
        }
      } else if (id) {
        const { error } = await supabase
          .from("candidate_experience")
          .update(payload)
          .eq("id", id)
          .eq("candidate_id", ensured.data);
        if (error) {
          return {
            success: false,
            error: getErrorMessage(error, "Unable to save experience."),
          };
        }
      }

      return this.listExperience(ensured.data);
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Unable to save experience."),
      };
    }
  },

  async listExperience(
    candidateId?: string,
  ): Promise<CareerServiceResult<CareerExperience[]>> {
    const { supabase, user } = await getAuthContext();
    if (!user) return { success: false, error: "Unable to load experience." };
    const ensured = candidateId
      ? { success: true as const, data: candidateId }
      : await ensureCandidate(supabase, user);
    if (!ensured.success) return ensured;

    const { data, error } = await supabase
      .from("candidate_experience")
      .select("*")
      .eq("candidate_id", ensured.data)
      .order("currently_working", { ascending: false })
      .order("start_date", { ascending: false });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Unable to load experience."),
      };
    }

    await syncExperienceJson(supabase, ensured.data, data ?? []);
    return {
      success: true,
      data: (data ?? []).map(mapExperienceRow),
    };
  },

  async createEducation(
    input: Omit<CareerEducation, "id">,
  ): Promise<CareerServiceResult<CareerEducation[]>> {
    return this.mutateEducation("create", input);
  },

  async updateEducation(
    id: string,
    input: Omit<CareerEducation, "id">,
  ): Promise<CareerServiceResult<CareerEducation[]>> {
    return this.mutateEducation("update", input, id);
  },

  async deleteEducation(
    id: string,
  ): Promise<CareerServiceResult<CareerEducation[]>> {
    try {
      const { supabase, user } = await getAuthContext();
      if (!user) return { success: false, error: "Unable to delete education." };
      const ensured = await ensureCandidate(supabase, user);
      if (!ensured.success) return ensured;

      const { error } = await supabase
        .from("candidate_education")
        .delete()
        .eq("id", id)
        .eq("candidate_id", ensured.data);

      if (error) {
        return {
          success: false,
          error: getErrorMessage(error, "Unable to delete education."),
        };
      }

      return this.listEducation(ensured.data);
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Unable to delete education."),
      };
    }
  },

  async mutateEducation(
    mode: "create" | "update",
    input: Omit<CareerEducation, "id">,
    id?: string,
  ): Promise<CareerServiceResult<CareerEducation[]>> {
    try {
      const { supabase, user } = await getAuthContext();
      if (!user) return { success: false, error: "Unable to save education." };
      const ensured = await ensureCandidate(supabase, user);
      if (!ensured.success) return ensured;

      const payload = educationToDb(input);

      if (mode === "create") {
        const { error } = await supabase.from("candidate_education").insert({
          candidate_id: ensured.data,
          ...payload,
        });
        if (error) {
          return {
            success: false,
            error: getErrorMessage(error, "Unable to save education."),
          };
        }
      } else if (id) {
        const { error } = await supabase
          .from("candidate_education")
          .update(payload)
          .eq("id", id)
          .eq("candidate_id", ensured.data);
        if (error) {
          return {
            success: false,
            error: getErrorMessage(error, "Unable to save education."),
          };
        }
      }

      return this.listEducation(ensured.data);
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Unable to save education."),
      };
    }
  },

  async listEducation(
    candidateId?: string,
  ): Promise<CareerServiceResult<CareerEducation[]>> {
    const { supabase, user } = await getAuthContext();
    if (!user) return { success: false, error: "Unable to load education." };
    const ensured = candidateId
      ? { success: true as const, data: candidateId }
      : await ensureCandidate(supabase, user);
    if (!ensured.success) return ensured;

    const { data, error } = await supabase
      .from("candidate_education")
      .select("*")
      .eq("candidate_id", ensured.data)
      .order("start_date", { ascending: false });

    if (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Unable to load education."),
      };
    }

    await syncEducationJson(supabase, ensured.data, data ?? []);
    return {
      success: true,
      data: (data ?? []).map(mapEducationRow),
    };
  },

  async saveHighlights(
    highlights: CareerHighlight[],
  ): Promise<CareerServiceResult<CareerHighlight[]>> {
    try {
      const { supabase, user } = await getAuthContext();
      if (!user) {
        return { success: false, error: "Unable to save career highlights." };
      }
      const ensured = await ensureCandidate(supabase, user);
      if (!ensured.success) return ensured;

      const { data: existing } = await supabase
        .from("candidate_career_highlights")
        .select("id")
        .eq("candidate_id", ensured.data);

      const existingIds = new Set((existing ?? []).map((row) => row.id));
      const keepIds = new Set(
        highlights
          .map((item) => item.id)
          .filter((id) => !id.startsWith("hl-") && !id.startsWith("temp-")),
      );

      const toDelete = [...existingIds].filter((id) => !keepIds.has(id));
      if (toDelete.length) {
        await supabase
          .from("candidate_career_highlights")
          .delete()
          .in("id", toDelete);
      }

      for (const [index, item] of highlights.entries()) {
        const payload = {
          content: item.text.trim(),
          display_order: index + 1,
        };
        const persisted = existingIds.has(item.id);

        if (persisted) {
          await supabase
            .from("candidate_career_highlights")
            .update(payload)
            .eq("id", item.id)
            .eq("candidate_id", ensured.data);
        } else {
          await supabase.from("candidate_career_highlights").insert({
            candidate_id: ensured.data,
            ...payload,
          });
        }
      }

      const { data } = await supabase
        .from("candidate_career_highlights")
        .select("*")
        .eq("candidate_id", ensured.data)
        .order("display_order", { ascending: true });

      return {
        success: true,
        data: (data ?? []).map(mapHighlightRow),
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Unable to save career highlights."),
      };
    }
  },
};

// Keep Tables import referenced for clarity
export type CandidateProfileLite = Pick<
  Tables<"candidate_profiles">,
  "id" | "resume_url"
>;
