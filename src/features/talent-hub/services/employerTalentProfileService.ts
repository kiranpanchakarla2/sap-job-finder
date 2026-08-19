import { createClient } from "@/lib/supabase/client";
import { getCurrentProfile } from "@/services/authService";
import { MOCK_EMPLOYER_CANDIDATE_PROFILES } from "../data/mockEmployerCandidateProfiles";
import { MOCK_PUBLIC_TALENT_CANDIDATES } from "../data/mockPublicTalent";
import type {
  EmployerCandidateCertification,
  EmployerCandidateEducation,
  EmployerCandidateExperience,
  EmployerCandidateProfile,
  EmployerCandidateServiceResult,
} from "../types/employerCandidate.types";

function buildFallbackFromPublic(
  publicCand: (typeof MOCK_PUBLIC_TALENT_CANDIDATES)[0],
): EmployerCandidateProfile {
  return {
    id: publicCand.id,
    name: "SAP Specialist",
    headline: publicCand.title,
    title: publicCand.title,
    avatarUrl: null,
    roleCategory: publicCand.roleCategory,
    yearsOfExperience: publicCand.yearsOfExperience,
    experienceBand: publicCand.experienceBand,
    location: publicCand.location,
    city: publicCand.city,
    country: publicCand.country,
    preferredLocations: [publicCand.city, "Remote"],
    workModes: publicCand.workModes,
    employmentTypes: ["full_time", "contract"],
    availability: publicCand.availability,
    noticePeriod: "Available per notice terms",
    sapModules: publicCand.sapModules,
    skills: publicCand.skills,
    certifications: publicCand.certifications.map((c, i) => ({
      id: `cert-${i + 1}`,
      name: c,
      issuingOrg: "SAP SE",
      year: 2022,
    })),
    experience: [
      {
        id: "exp-gen-1",
        company: "Enterprise Implementation Partner",
        role: publicCand.title,
        startDate: "2020",
        endDate: null,
        description: publicCand.summary,
        skills: publicCand.skills,
        isSapProject: true,
      },
    ],
    education: [
      {
        id: "edu-gen-1",
        school: "Accredited University",
        degree: "Bachelor of Technology / Engineering",
        field: "Information Systems",
        year: 2017,
      },
    ],
    languages: ["English (Fluent)", "Hindi (Professional)"],
    professionalSummary: publicCand.summary,
    resumeUrl: null,
    resumeFileName: null,
    hasResumeAccess: false,
    discoveryStatus: publicCand.discoveryStatus,
    isSearchable: true,
  };
}

export const employerTalentProfileService = {
  /**
   * Fetches the complete permitted candidate profile for an authorized employer.
   * Strictly enforces employer authentication and candidate visibility state.
   */
  async getPermittedCandidateProfile(
    candidateId: string,
  ): Promise<EmployerCandidateServiceResult> {
    try {
      const supabase = createClient();

      // 1. Verify user authentication session
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return {
          success: false,
          code: "UNAUTHENTICATED",
          error: "Employer sign-in required to view complete talent profiles.",
        };
      }

      // 2. Verify employer/admin role in database
      const profile = await getCurrentProfile();
      if (!profile || (profile.role !== "employer" && profile.role !== "admin")) {
        return {
          success: false,
          code: "UNAUTHORIZED",
          error:
            "Your account does not have employer permission to access full candidate profiles.",
        };
      }

      // 3. Check for mock profile first if matching mock ID
      if (candidateId in MOCK_EMPLOYER_CANDIDATE_PROFILES) {
        const mockProfile = MOCK_EMPLOYER_CANDIDATE_PROFILES[candidateId];
        if (!mockProfile.isSearchable || mockProfile.discoveryStatus === "not_available") {
          return {
            success: false,
            code: "PRIVATE_PROFILE",
            error: "This candidate profile is private and unavailable for discovery.",
          };
        }
        return {
          success: true,
          data: mockProfile,
        };
      }

      const publicMatch = MOCK_PUBLIC_TALENT_CANDIDATES.find(
        (c) => c.id === candidateId,
      );
      if (publicMatch) {
        return {
          success: true,
          data: buildFallbackFromPublic(publicMatch),
        };
      }

      // 4. Query live candidate from Supabase candidate_profiles selecting only permitted fields
      const { data: candRow, error: candError } = await supabase
        .from("candidate_profiles")
        .select(
          `
          id,
          first_name,
          last_name,
          headline,
          current_job_role,
          sap_skills,
          skills,
          years_of_experience,
          total_experience,
          location,
          current_city,
          country,
          work_modes,
          employment_types,
          availability,
          notice_period,
          discovery_status,
          is_searchable,
          professional_summary,
          about_me,
          work_experience,
          certifications,
          education,
          languages,
          resume_url,
          resume_file_name
        `,
        )
        .eq("id", candidateId)
        .maybeSingle();

      if (candError || !candRow) {
        return {
          success: false,
          code: "CANDIDATE_NOT_AVAILABLE",
          error: "Candidate profile could not be found.",
        };
      }

      // 5. Enforce candidate privacy settings
      if (!candRow.is_searchable || candRow.discovery_status === "not_available") {
        return {
          success: false,
          code: "PRIVATE_PROFILE",
          error: "This candidate has set their profile to private.",
        };
      }

      const raw = candRow as Record<string, unknown>;
      const fullName = [raw.first_name, raw.last_name]
        .filter((s): s is string => typeof s === "string" && Boolean(s.trim()))
        .join(" ") || "SAP Specialist";

      const headline =
        typeof raw.headline === "string" && raw.headline.trim()
          ? raw.headline.trim()
          : typeof raw.current_job_role === "string" && raw.current_job_role.trim()
            ? raw.current_job_role.trim()
            : "SAP Professional";

      const years =
        typeof raw.years_of_experience === "number"
          ? raw.years_of_experience
          : typeof raw.total_experience === "number"
            ? raw.total_experience
            : 5;

      const sapModules = Array.isArray(raw.sap_skills)
        ? raw.sap_skills.filter((s): s is string => typeof s === "string")
        : [];

      const skills = Array.isArray(raw.skills)
        ? raw.skills.filter((s): s is string => typeof s === "string")
        : [];

      const experience = Array.isArray(raw.work_experience)
        ? (raw.work_experience as EmployerCandidateExperience[])
        : [];

      const education = Array.isArray(raw.education)
        ? (raw.education as EmployerCandidateEducation[])
        : [];

      const certifications = Array.isArray(raw.certifications)
        ? (raw.certifications as EmployerCandidateCertification[])
        : [];

      const languages = Array.isArray(raw.languages)
        ? raw.languages.filter((l): l is string => typeof l === "string")
        : ["English"];

      const resultProfile: EmployerCandidateProfile = {
        id: candRow.id,
        name: fullName,
        headline,
        title: headline,
        avatarUrl: null,
        roleCategory: "consultant",
        yearsOfExperience: years,
        experienceBand: years <= 2 ? "0-2" : years <= 5 ? "3-5" : years <= 8 ? "6-8" : years <= 12 ? "9-12" : "13+",
        location: (raw.location as string) || "India",
        city: (raw.current_city as string) || "India",
        country: (raw.country as string) || "India",
        preferredLocations: [(raw.current_city as string) || "India", "Remote"],
        workModes: Array.isArray(raw.work_modes) ? (raw.work_modes as ("remote" | "hybrid" | "onsite")[]) : ["hybrid"],
        employmentTypes: Array.isArray(raw.employment_types) ? (raw.employment_types as ("full_time" | "contract")[]) : ["full_time"],
        availability: "available_now",
        noticePeriod: (raw.notice_period as string) || undefined,
        sapModules,
        skills,
        certifications,
        experience,
        education,
        languages,
        professionalSummary: (raw.professional_summary as string) || (raw.about_me as string) || "Experienced SAP specialist.",
        resumeUrl: (raw.resume_url as string) || null,
        resumeFileName: (raw.resume_file_name as string) || null,
        hasResumeAccess: Boolean(raw.resume_url),
        discoveryStatus: candRow.discovery_status === "available" ? "available" : "open_to_opportunities",
        isSearchable: true,
      };

      return {
        success: true,
        data: resultProfile,
      };
    } catch {
      return {
        success: false,
        code: "GENERIC",
        error: "An unexpected error occurred while loading the candidate profile.",
      };
    }
  },
};
