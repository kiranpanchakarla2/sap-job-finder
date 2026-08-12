import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types";
import { calculateProfileCompletion } from "../lib/profileCompletion";
import {
  emptyCandidateProfileForm,
  mapDbToCandidateProfileForm,
  mapFormToCandidateProfileUpdate,
  type CandidateCertificationRow,
  type CandidateProfileRow,
} from "../lib/candidateProfileMapper";
import type { CandidateProfileForm } from "../types/profile.types";

const AVATAR_BUCKET = "candidate-avatars";

export type CandidateProfileServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: unknown }).message ?? "").trim();
    if (message) {
      if (process.env.NODE_ENV === "development") {
        console.error("[candidateProfileService]", message, error);
      }
      return fallback;
    }
  }
  return fallback;
}

async function getAuthenticatedUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return { supabase, user: null as null };
  }
  return { supabase, user };
}

async function ensureCandidateProfileRow(
  supabase: ReturnType<typeof createClient>,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
): Promise<CandidateProfileServiceResult<CandidateProfileRow>> {
  const { data: existing, error: selectError } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (selectError) {
    return {
      success: false,
      error: getErrorMessage(selectError, "Unable to load your profile."),
    };
  }

  if (existing) {
    return { success: true, data: existing };
  }

  const meta = user.user_metadata ?? {};
  const firstName =
    typeof meta.first_name === "string" ? meta.first_name : null;
  const lastName = typeof meta.last_name === "string" ? meta.last_name : null;
  const phone = typeof meta.phone === "string" ? meta.phone : null;

  const { data: created, error: insertError } = await supabase
    .from("candidate_profiles")
    .insert({
      user_id: user.id,
      first_name: firstName,
      last_name: lastName,
      phone,
      profile_completion: 0,
    })
    .select("*")
    .single();

  if (insertError || !created) {
    // Race: another request may have created the row via trigger
    const { data: raced, error: raceError } = await supabase
      .from("candidate_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (raced) {
      return { success: true, data: raced };
    }

    return {
      success: false,
      error: getErrorMessage(
        insertError ?? raceError,
        "Unable to initialize your profile.",
      ),
    };
  }

  return { success: true, data: created };
}

async function loadCertifications(
  supabase: ReturnType<typeof createClient>,
  candidateId: string,
): Promise<CandidateCertificationRow[]> {
  const { data, error } = await supabase
    .from("candidate_certifications")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("issued_date", { ascending: false });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[candidateProfileService] certifications", error.message);
    }
    return [];
  }

  return data ?? [];
}

async function syncCandidateSkills(
  supabase: ReturnType<typeof createClient>,
  candidateId: string,
  form: CandidateProfileForm,
) {
  const skillNames = [
    ...new Set([
      ...form.sapExpertise.modules.map((item) => item.trim()).filter(Boolean),
      ...form.sapExpertise.technicalSkills
        .map((item) => item.trim())
        .filter(Boolean),
    ]),
  ];

  const yearsByName = new Map(
    form.sapExpertise.moduleExperience.map((item) => [
      item.module.trim().toLowerCase(),
      item.years,
    ]),
  );

  const { data: existingLinks } = await supabase
    .from("candidate_skills")
    .select("id, skill_id")
    .eq("candidate_id", candidateId);

  const links = existingLinks ?? [];
  const skillIds = links.map((link) => link.skill_id);
  const { data: skillRows } = skillIds.length
    ? await supabase.from("skills").select("id, name").in("id", skillIds)
    : { data: [] as { id: string; name: string }[] };

  const nameById = new Map(
    (skillRows ?? []).map((row) => [row.id, row.name.trim()]),
  );

  const existingByName = new Map<
    string,
    { id: string; skill_id: string }
  >();

  for (const link of links) {
    const name = nameById.get(link.skill_id);
    if (name) existingByName.set(name.toLowerCase(), link);
  }

  const desired = new Set(skillNames.map((name) => name.toLowerCase()));

  const toDelete = [...existingByName.entries()]
    .filter(([name]) => !desired.has(name))
    .map(([, row]) => row.id);

  if (toDelete.length) {
    await supabase.from("candidate_skills").delete().in("id", toDelete);
  }

  for (const name of skillNames) {
    const key = name.toLowerCase();
    let skillId: string | null = null;

    const { data: existingSkill } = await supabase
      .from("skills")
      .select("id")
      .ilike("name", name)
      .maybeSingle();

    if (existingSkill?.id) {
      skillId = existingSkill.id;
    } else {
      const category = name.toUpperCase().startsWith("SAP") ? "SAP" : "Technical";
      const { data: inserted } = await supabase
        .from("skills")
        .insert({ name, category })
        .select("id")
        .maybeSingle();
      skillId = inserted?.id ?? null;

      if (!skillId) {
        // Unique race — fetch again
        const { data: raced } = await supabase
          .from("skills")
          .select("id")
          .ilike("name", name)
          .maybeSingle();
        skillId = raced?.id ?? null;
      }
    }

    if (!skillId) continue;

    const years = yearsByName.get(key) ?? null;
    const existing = existingByName.get(key);

    if (existing) {
      await supabase
        .from("candidate_skills")
        .update({ experience_years: years })
        .eq("id", existing.id);
    } else {
      await supabase.from("candidate_skills").insert({
        candidate_id: candidateId,
        skill_id: skillId,
        experience_years: years,
      });
    }
  }
}

async function syncCertifications(
  supabase: ReturnType<typeof createClient>,
  candidateId: string,
  form: CandidateProfileForm,
) {
  const { data: existing } = await supabase
    .from("candidate_certifications")
    .select("id")
    .eq("candidate_id", candidateId);

  const existingIds = new Set((existing ?? []).map((row) => row.id));
  const keepIds = new Set(
    form.certifications
      .map((cert) => cert.id)
      .filter((id) => !id.startsWith("cert-") && !id.startsWith("temp-")),
  );

  const toDelete = [...existingIds].filter((id) => !keepIds.has(id));
  if (toDelete.length) {
    await supabase
      .from("candidate_certifications")
      .delete()
      .in("id", toDelete);
  }

  for (const cert of form.certifications) {
    const payload = {
      certificate_name: cert.name.trim(),
      issuer: cert.issuingOrganization.trim() || null,
      credential_id: cert.certificationId.trim() || null,
      issued_date: cert.issueDate || null,
      expiry_date: cert.expiryDate || null,
      status: cert.status,
    };

    const isPersisted =
      existingIds.has(cert.id) &&
      !cert.id.startsWith("cert-") &&
      !cert.id.startsWith("temp-");

    if (isPersisted) {
      await supabase
        .from("candidate_certifications")
        .update(payload)
        .eq("id", cert.id)
        .eq("candidate_id", candidateId);
    } else {
      await supabase.from("candidate_certifications").insert({
        candidate_id: candidateId,
        ...payload,
      });
    }
  }
}

export const candidateProfileService = {
  async getMyProfile(): Promise<
    CandidateProfileServiceResult<CandidateProfileForm>
  > {
    try {
      const { supabase, user } = await getAuthenticatedUser();
      if (!user) {
        return { success: false, error: "Unable to load your profile." };
      }

      const ensured = await ensureCandidateProfileRow(supabase, user);
      if (!ensured.success) return ensured;

      const { data: identity } = await supabase
        .from("profiles")
        .select("email, first_name, last_name, phone, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      const certifications = await loadCertifications(supabase, ensured.data.id);
      const email =
        identity?.email?.trim() || user.email || "";

      // Prefer identity names when candidate row is empty
      const row: CandidateProfileRow = {
        ...ensured.data,
        first_name: ensured.data.first_name || identity?.first_name || null,
        last_name: ensured.data.last_name || identity?.last_name || null,
        phone: ensured.data.phone || identity?.phone || null,
        avatar_url:
          ensured.data.avatar_url ||
          ensured.data.profile_photo_url ||
          identity?.avatar_url ||
          null,
      };

      return {
        success: true,
        data: mapDbToCandidateProfileForm({
          email,
          profile: row,
          certifications,
        }),
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Unable to load your profile."),
      };
    }
  },

  async saveMyProfile(
    form: CandidateProfileForm,
  ): Promise<CandidateProfileServiceResult<CandidateProfileForm>> {
    try {
      const { supabase, user } = await getAuthenticatedUser();
      if (!user) {
        return {
          success: false,
          error: "We couldn't save your profile. Please try again.",
        };
      }

      const ensured = await ensureCandidateProfileRow(supabase, user);
      if (!ensured.success) {
        return {
          success: false,
          error: "We couldn't save your profile. Please try again.",
        };
      }

      const completion = calculateProfileCompletion(form).percent;
      const updatePayload = mapFormToCandidateProfileUpdate(form, completion);

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: updatePayload.first_name,
          last_name: updatePayload.last_name,
          phone: updatePayload.phone,
          avatar_url: updatePayload.avatar_url,
        })
        .eq("user_id", user.id);

      if (profileError) {
        return {
          success: false,
          error: getErrorMessage(
            profileError,
            "We couldn't save your profile. Please try again.",
          ),
        };
      }

      const { error: candidateError } = await supabase
        .from("candidate_profiles")
        .update(updatePayload)
        .eq("user_id", user.id);

      if (candidateError) {
        return {
          success: false,
          error: getErrorMessage(
            candidateError,
            "We couldn't save your profile. Please try again.",
          ),
        };
      }

      await syncCertifications(supabase, ensured.data.id, form);
      await syncCandidateSkills(supabase, ensured.data.id, form);

      return this.getMyProfile();
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(
          error,
          "We couldn't save your profile. Please try again.",
        ),
      };
    }
  },

  async uploadAvatar(
    file: File,
  ): Promise<CandidateProfileServiceResult<string>> {
    try {
      if (!file.type.startsWith("image/")) {
        return { success: false, error: "Please choose a PNG or JPG image." };
      }
      if (file.size > 2 * 1024 * 1024) {
        return { success: false, error: "Image must be 2 MB or smaller." };
      }

      const { supabase, user } = await getAuthenticatedUser();
      if (!user) {
        return { success: false, error: "Photo upload failed. Please try again." };
      }

      const ext =
        file.type === "image/png"
          ? "png"
          : file.type === "image/webp"
            ? "webp"
            : "jpg";
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        return {
          success: false,
          error: getErrorMessage(
            uploadError,
            "Photo upload failed. Please try again.",
          ),
        };
      }

      const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
      if (!data?.publicUrl) {
        return { success: false, error: "Photo upload failed. Please try again." };
      }

      const url = `${data.publicUrl}?v=${Date.now()}`;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("user_id", user.id);

      if (profileError) {
        return {
          success: false,
          error: getErrorMessage(
            profileError,
            "Photo upload failed. Please try again.",
          ),
        };
      }

      await supabase
        .from("candidate_profiles")
        .update({
          avatar_url: url,
          profile_photo_url: url,
        })
        .eq("user_id", user.id);

      return { success: true, data: url };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Photo upload failed. Please try again."),
      };
    }
  },

  async getProfileCompletionPercent(): Promise<
    CandidateProfileServiceResult<number>
  > {
    const result = await this.getMyProfile();
    if (!result.success) return result;
    return {
      success: true,
      data: calculateProfileCompletion(result.data).percent,
    };
  },

  createEmptyForm(input: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
  }): CandidateProfileForm {
    return emptyCandidateProfileForm(input);
  },
};

// Keep Tables import used for clarity in sync helpers
export type CandidateSkillRow = Tables<"candidate_skills">;
