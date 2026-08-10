import { createClient } from "@/lib/supabase/client";
import {
  mapCompanyProfileRow,
  toCompanyProfileInsert,
  type CompanyProfileRow,
} from "../lib/mappers";
import type {
  CompanyOnboardingInput,
  CompanyProfile,
  CompanyProfileUpdateInput,
  CompanyServiceResult,
} from "../types/company.types";

const COMPANY_LOGO_BUCKET = "company-logos";

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: unknown }).message ?? "").trim();
    if (message) return message;
  }
  return fallback;
}

async function syncEmployerProfileMirror(
  userId: string,
  data: {
    companyName: string;
    logoUrl: string | null;
    website: string;
    industry: string;
    companySize: string;
    about: string;
    country: string;
    city: string;
    designation: string;
    phone: string;
    recruiterName: string;
  },
) {
  const supabase = createClient();
  const headquarters = [data.city, data.country].filter(Boolean).join(", ");

  const { error: employerError } = await supabase
    .from("employer_profiles")
    .update({
      company_name: data.companyName || "My Company",
      company_logo_url: data.logoUrl,
      website: data.website || null,
      industry: data.industry || null,
      company_size: data.companySize || null,
      about_company: data.about || null,
      headquarters: headquarters || null,
    })
    .eq("user_id", userId);

  if (employerError) {
    console.warn("[companyService] employer_profiles sync failed", employerError.message);
  }

  const nameParts = data.recruiterName.trim().split(/\s+/);
  const firstName = nameParts[0] || null;
  const lastName = nameParts.slice(1).join(" ") || null;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      phone: data.phone || null,
    })
    .eq("user_id", userId);

  if (profileError) {
    console.warn("[companyService] profiles sync failed", profileError.message);
  }

  const { data: employer } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (employer?.id) {
    const { error: recruiterError } = await supabase
      .from("recruiters")
      .update({ designation: data.designation || null })
      .eq("employer_id", employer.id)
      .eq("user_id", userId)
      .eq("is_primary", true);

    if (recruiterError) {
      console.warn("[companyService] recruiters sync failed", recruiterError.message);
    }
  }
}

/**
 * Supabase-backed company profile service (Sprint 2).
 * Source of truth: public.company_profiles
 * Mirrors brand fields into employer_profiles for jobs FK compatibility.
 */
export const companyService = {
  async getCompanyProfile(employerId: string): Promise<CompanyServiceResult<CompanyProfile | null>> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", employerId)
        .maybeSingle();

      if (error) {
        return { success: false, error: getErrorMessage(error, "Unable to load company information.") };
      }

      if (!data) {
        return { success: true, data: null };
      }

      return { success: true, data: mapCompanyProfileRow(data as CompanyProfileRow) };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, "Unable to load company information.") };
    }
  },

  async isSetupComplete(employerId: string): Promise<boolean> {
    const result = await this.getCompanyProfile(employerId);
    return Boolean(result.success && result.data?.setupComplete);
  },

  async completeOnboarding(
    employerId: string,
    input: CompanyOnboardingInput,
    workEmail: string,
  ): Promise<CompanyServiceResult<CompanyProfile>> {
    try {
      const supabase = createClient();
      const payload = toCompanyProfileInsert({
        userId: employerId,
        companyName: input.companyName.trim(),
        logoUrl: input.logoUrl,
        website: input.website.trim(),
        industry: input.industry,
        companySize: input.companySize,
        country: input.country,
        state: input.state.trim(),
        city: input.city.trim(),
        address: input.address.trim(),
        about: input.about.trim(),
        recruiterName: input.recruiterName.trim(),
        designation: input.designation.trim(),
        workEmail: workEmail.trim().toLowerCase(),
        phone: input.phone.trim(),
        setupComplete: true,
      });

      const { data, error } = await supabase
        .from("company_profiles")
        .upsert(payload, { onConflict: "user_id" })
        .select("*")
        .single();

      if (error || !data) {
        return {
          success: false,
          error: getErrorMessage(error, "Unable to complete company setup."),
        };
      }

      const profile = mapCompanyProfileRow(data as CompanyProfileRow);
      await syncEmployerProfileMirror(employerId, {
        companyName: profile.companyName,
        logoUrl: profile.logoUrl,
        website: profile.website,
        industry: profile.industry,
        companySize: profile.companySize,
        about: profile.about,
        country: profile.country,
        city: profile.city,
        designation: profile.designation,
        phone: profile.phone,
        recruiterName: profile.recruiterName,
      });

      return { success: true, data: profile };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, "Unable to complete company setup.") };
    }
  },

  async updateCompanyProfile(
    employerId: string,
    input: CompanyProfileUpdateInput,
  ): Promise<CompanyServiceResult<CompanyProfile>> {
    try {
      const existing = await this.getCompanyProfile(employerId);
      if (!existing.success) return existing;
      if (!existing.data) {
        return { success: false, error: "Company profile not found." };
      }

      const supabase = createClient();
      const next = {
        ...existing.data,
        ...input,
        workEmail: existing.data.workEmail,
        employerId,
        setupComplete: true,
      };

      const { data, error } = await supabase
        .from("company_profiles")
        .update({
          company_name: next.companyName.trim(),
          logo_url: next.logoUrl,
          website: next.website.trim(),
          industry: next.industry,
          company_size: next.companySize,
          country: next.country,
          state: next.state.trim(),
          city: next.city.trim(),
          address: next.address.trim(),
          about: next.about.trim(),
          recruiter_name: next.recruiterName.trim(),
          designation: next.designation.trim(),
          phone: next.phone.trim(),
          setup_complete: true,
        })
        .eq("user_id", employerId)
        .select("*")
        .single();

      if (error || !data) {
        return {
          success: false,
          error: getErrorMessage(error, "Unable to save company profile."),
        };
      }

      const profile = mapCompanyProfileRow(data as CompanyProfileRow);
      await syncEmployerProfileMirror(employerId, {
        companyName: profile.companyName,
        logoUrl: profile.logoUrl,
        website: profile.website,
        industry: profile.industry,
        companySize: profile.companySize,
        about: profile.about,
        country: profile.country,
        city: profile.city,
        designation: profile.designation,
        phone: profile.phone,
        recruiterName: profile.recruiterName,
      });

      return { success: true, data: profile };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, "Unable to save company profile.") };
    }
  },

  async uploadLogo(
    employerId: string,
    file: File,
  ): Promise<CompanyServiceResult<string>> {
    try {
      if (!file.type.startsWith("image/")) {
        return { success: false, error: "Please upload an image file." };
      }
      if (file.size > 2 * 1024 * 1024) {
        return { success: false, error: "Logo must be under 2 MB." };
      }

      const supabase = createClient();
      const extension = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${employerId}/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(COMPANY_LOGO_BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        return {
          success: false,
          error: getErrorMessage(uploadError, "Logo upload failed. Please try again."),
        };
      }

      const { data } = supabase.storage.from(COMPANY_LOGO_BUCKET).getPublicUrl(path);
      if (!data?.publicUrl) {
        return { success: false, error: "Logo upload failed. Please try again." };
      }

      return { success: true, data: data.publicUrl };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Logo upload failed. Please try again."),
      };
    }
  },
};
