import { createClient } from "@/lib/supabase/client";
import { resolveEmployerMembership } from "@/features/employer-auth/services/employerMembershipService";
import {
  isEmployerCompanyRole,
  type EmployerCompanyRole,
} from "@/lib/auth/employerPermissions";
import type {
  EmployerPersonalProfile,
  EmployerPersonalProfileUpdate,
  EmployerProfileServiceResult,
} from "../types/profile.types";

const AVATAR_BUCKET = "company-logos";

function companyRoleLabel(role: EmployerCompanyRole): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "recruiter":
      return "Recruiter";
    case "hiring_manager":
      return "Hiring Manager";
    default:
      return role;
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: unknown }).message ?? "").trim();
    if (message) return message;
  }
  return fallback;
}

export const employerProfileService = {
  async getMyProfile(): Promise<EmployerProfileServiceResult<EmployerPersonalProfile>> {
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { success: false, error: "Unable to load your profile." };
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email, phone, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError || !profile) {
        return { success: false, error: "Unable to load your profile." };
      }

      const { data: employer } = await supabase
        .from("employer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let jobTitle = "";
      if (employer?.id) {
        const { data: recruiter } = await supabase
          .from("recruiters")
          .select("designation")
          .eq("employer_id", employer.id)
          .eq("user_id", user.id)
          .maybeSingle();
        jobTitle = recruiter?.designation?.trim() ?? "";
      }

      const membership = await resolveEmployerMembership();
      let companyName: string | null = null;
      let companyRole: string | null = null;

      if (membership.status === "active" || membership.status === "suspended") {
        companyRole = isEmployerCompanyRole(membership.membership.role)
          ? companyRoleLabel(membership.membership.role)
          : membership.membership.role;

        const { data: company } = await supabase
          .from("company_profiles")
          .select("company_name")
          .eq("id", membership.membership.companyId)
          .maybeSingle();
        companyName = company?.company_name?.trim() || null;
      }

      return {
        success: true,
        data: {
          userId: user.id,
          firstName: profile.first_name?.trim() ?? "",
          lastName: profile.last_name?.trim() ?? "",
          email: profile.email?.trim() || user.email || "",
          phone: profile.phone?.trim() ?? "",
          jobTitle,
          avatarUrl: profile.avatar_url,
          companyRole,
          companyName,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Unable to load your profile."),
      };
    }
  },

  async updateMyProfile(
    input: EmployerPersonalProfileUpdate,
  ): Promise<EmployerProfileServiceResult<EmployerPersonalProfile>> {
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return { success: false, error: "Unable to update your profile." };
      }

      const firstName = input.firstName.trim();
      const lastName = input.lastName.trim();
      const phone = input.phone.trim();
      const jobTitle = input.jobTitle.trim();

      if (!firstName || !lastName) {
        return { success: false, error: "First name and last name are required." };
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          avatar_url: input.avatarUrl,
        })
        .eq("user_id", user.id);

      if (profileError) {
        return {
          success: false,
          error: getErrorMessage(profileError, "Unable to update your profile."),
        };
      }

      const { data: employer } = await supabase
        .from("employer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (employer?.id) {
        const { error: recruiterError } = await supabase
          .from("recruiters")
          .update({ designation: jobTitle || null })
          .eq("employer_id", employer.id)
          .eq("user_id", user.id);

        if (recruiterError) {
          console.warn(
            "[employerProfileService] recruiters designation sync failed",
            recruiterError.message,
          );
        }
      }

      return this.getMyProfile();
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Unable to update your profile."),
      };
    }
  },

  async uploadAvatar(
    userId: string,
    file: File,
  ): Promise<EmployerProfileServiceResult<string>> {
    try {
      if (!file.type.startsWith("image/")) {
        return { success: false, error: "Please choose a PNG or JPG image." };
      }
      if (file.size > 2 * 1024 * 1024) {
        return { success: false, error: "Image must be 2 MB or smaller." };
      }

      const supabase = createClient();
      const ext =
        file.type === "image/png"
          ? "png"
          : file.type === "image/webp"
            ? "webp"
            : "jpg";
      const path = `${userId}/avatar.${ext}`;

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
          error: getErrorMessage(uploadError, "Photo upload failed. Please try again."),
        };
      }

      const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
      if (!data?.publicUrl) {
        return { success: false, error: "Photo upload failed. Please try again." };
      }

      // Cache-bust so the UI refreshes immediately after upsert
      const url = `${data.publicUrl}?v=${Date.now()}`;
      return { success: true, data: url };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Photo upload failed. Please try again."),
      };
    }
  },
};
