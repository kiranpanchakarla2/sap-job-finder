import type { Tables } from "@/types";
import type {
  CareerLevel,
  CandidateCertification,
  CandidateProfileForm,
  CertificationStatus,
  EmploymentStatus,
  EmploymentType,
  GenderOption,
  SapModuleExperience,
  WorkMode,
} from "../types/profile.types";

export type CandidateProfileRow = Tables<"candidate_profiles">;
export type CandidateCertificationRow = Tables<"candidate_certifications">;

const WORK_MODE_TO_DB: Record<WorkMode, string> = {
  Remote: "remote",
  Hybrid: "hybrid",
  "On-site": "onsite",
};

const WORK_MODE_FROM_DB: Record<string, WorkMode> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
  "on-site": "On-site",
  "on_site": "On-site",
  Remote: "Remote",
  Hybrid: "Hybrid",
  "On-site": "On-site",
};

const EMPLOYMENT_TYPE_TO_DB: Record<EmploymentType, string> = {
  "Full-time": "full_time",
  Contract: "contract",
  "Part-time": "part_time",
};

const EMPLOYMENT_TYPE_FROM_DB: Record<string, EmploymentType> = {
  full_time: "Full-time",
  contract: "Contract",
  part_time: "Part-time",
  "Full-time": "Full-time",
  Contract: "Contract",
  "Part-time": "Part-time",
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function parseModuleExperience(value: unknown): SapModuleExperience[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as { module?: unknown; years?: unknown };
      const module = typeof row.module === "string" ? row.module.trim() : "";
      const years = Number(row.years);
      if (!module) return null;
      return {
        module,
        years: Number.isFinite(years) ? years : 0,
      };
    })
    .filter((item): item is SapModuleExperience => Boolean(item));
}

function mapWorkModes(values: string[]): WorkMode[] {
  const mapped = values
    .map((value) => WORK_MODE_FROM_DB[value] ?? WORK_MODE_FROM_DB[value.toLowerCase()])
    .filter((value): value is WorkMode => Boolean(value));
  return [...new Set(mapped)];
}

function mapEmploymentTypes(values: string[]): EmploymentType[] {
  const mapped = values
    .map(
      (value) =>
        EMPLOYMENT_TYPE_FROM_DB[value] ??
        EMPLOYMENT_TYPE_FROM_DB[value.toLowerCase()],
    )
    .filter((value): value is EmploymentType => Boolean(value));
  return [...new Set(mapped)];
}

function mapCertificationStatus(value: string | null | undefined): CertificationStatus {
  if (value === "Expired" || value === "In Progress" || value === "Active") {
    return value;
  }
  return "Active";
}

export function mapCertificationsFromRows(
  rows: CandidateCertificationRow[],
): CandidateCertification[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.certificate_name,
    issuingOrganization: row.issuer ?? "",
    certificationId: row.credential_id ?? "",
    issueDate: row.issued_date ?? "",
    expiryDate: row.expiry_date ?? "",
    status: mapCertificationStatus(row.status),
  }));
}

export function emptyCandidateProfileForm(input: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}): CandidateProfileForm {
  return {
    photoUrl: null,
    personal: {
      firstName: input.firstName?.trim() ?? "",
      lastName: input.lastName?.trim() ?? "",
      email: input.email,
      phone: input.phone?.trim() ?? "",
      dateOfBirth: "",
      gender: "",
      currentLocation: "",
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
      modules: [],
      technicalSkills: [],
      moduleExperience: [],
    },
    certifications: [],
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
    hasResume: false,
  };
}

export function mapDbToCandidateProfileForm(input: {
  email: string;
  profile: CandidateProfileRow;
  certifications: CandidateCertificationRow[];
}): CandidateProfileForm {
  const { profile, certifications, email } = input;
  const location =
    profile.location?.trim() ||
    [profile.current_city, profile.country].filter(Boolean).join(", ") ||
    "";

  const preferredLocations = asStringArray(profile.preferred_locations);
  if (!preferredLocations.length && profile.preferred_location?.trim()) {
    preferredLocations.push(profile.preferred_location.trim());
  }

  const openToWorkEnabled =
    profile.is_searchable ||
    profile.discovery_status === "open_to_opportunities" ||
    profile.discovery_status === "available";

  return {
    photoUrl:
      profile.avatar_url?.trim() ||
      profile.profile_photo_url?.trim() ||
      null,
    personal: {
      firstName: profile.first_name?.trim() ?? "",
      lastName: profile.last_name?.trim() ?? "",
      email,
      phone: profile.phone?.trim() ?? "",
      dateOfBirth: profile.date_of_birth ?? "",
      gender: (profile.gender as GenderOption) || "",
      currentLocation: location,
      preferredLocation:
        profile.preferred_location?.trim() ||
        preferredLocations[0] ||
        "",
    },
    professionalSummary: profile.professional_summary?.trim() || profile.about_me?.trim() || "",
    career: {
      currentJobTitle:
        profile.current_job_role?.trim() || profile.headline?.trim() || "",
      currentCompany: profile.current_company?.trim() ?? "",
      totalExperience:
        profile.experience_band?.trim() ||
        (profile.total_experience != null
          ? `${profile.total_experience} years`
          : ""),
      relevantSapExperience: profile.sap_experience_band?.trim() ?? "",
      noticePeriod: profile.notice_period?.trim() ?? "",
      expectedSalary:
        profile.expected_salary_label?.trim() ||
        (profile.expected_salary != null
          ? String(profile.expected_salary)
          : ""),
      currentSalary:
        profile.current_salary_label?.trim() ||
        (profile.current_ctc != null ? String(profile.current_ctc) : ""),
      employmentStatus: (profile.employment_status as EmploymentStatus) || "",
    },
    sapExpertise: {
      modules: asStringArray(profile.sap_skills),
      technicalSkills: asStringArray(profile.skills),
      moduleExperience: parseModuleExperience(profile.module_experience),
    },
    certifications: mapCertificationsFromRows(certifications),
    preferences: {
      preferredJobRoles: asStringArray(profile.preferred_job_roles),
      preferredSapModules: asStringArray(profile.preferred_sap_modules),
      preferredLocations,
      workModes: mapWorkModes(asStringArray(profile.work_modes)),
      employmentTypes: mapEmploymentTypes(
        asStringArray(profile.employment_types),
      ),
      preferredSalaryRange: profile.preferred_salary_range?.trim() ?? "",
      careerLevel: (profile.career_level as CareerLevel | "") || "",
    },
    openToWork: {
      enabled: openToWorkEnabled,
      preferredJobRoles: asStringArray(profile.open_to_work_job_roles),
      preferredLocations: asStringArray(profile.open_to_work_locations),
      preferredWorkModes: mapWorkModes(
        asStringArray(profile.open_to_work_modes),
      ),
      availability: profile.availability?.trim() ?? "",
    },
    // Resume is Sprint 2 — only mark complete when a real resume URL exists
    hasResume: Boolean(profile.resume_url?.trim()),
  };
}

function parseExperienceYears(band: string): number | null {
  const trimmed = band.trim().toLowerCase();
  if (!trimmed || trimmed === "fresher") return 0;
  const range = trimmed.match(/(\d+)\s*[–-]\s*(\d+)/);
  if (range) return Number(range[2]);
  const single = trimmed.match(/(\d+(\.\d+)?)/);
  if (single) return Number(single[1]);
  if (trimmed.includes("12+")) return 12;
  return null;
}

export function mapFormToCandidateProfileUpdate(
  form: CandidateProfileForm,
  profileCompletion: number,
) {
  const preferredLocations = form.preferences.preferredLocations;
  const location = form.personal.currentLocation.trim();
  const city = location.split(",")[0]?.trim() || location;

  return {
    first_name: form.personal.firstName.trim(),
    last_name: form.personal.lastName.trim(),
    phone: form.personal.phone.trim() || null,
    date_of_birth: form.personal.dateOfBirth || null,
    gender: form.personal.gender || null,
    location: location || null,
    current_city: city || null,
    preferred_location:
      form.personal.preferredLocation.trim() ||
      preferredLocations[0] ||
      null,
    professional_summary: form.professionalSummary.trim() || null,
    about_me: form.professionalSummary.trim() || null,
    current_job_role: form.career.currentJobTitle.trim() || null,
    headline: form.career.currentJobTitle.trim() || null,
    current_company: form.career.currentCompany.trim() || null,
    experience_band: form.career.totalExperience.trim() || null,
    sap_experience_band: form.career.relevantSapExperience.trim() || null,
    total_experience: parseExperienceYears(form.career.totalExperience),
    years_of_experience: parseExperienceYears(form.career.totalExperience) ?? 0,
    notice_period: form.career.noticePeriod.trim() || null,
    current_salary_label: form.career.currentSalary.trim() || null,
    expected_salary_label: form.career.expectedSalary.trim() || null,
    employment_status: form.career.employmentStatus || null,
    sap_skills: form.sapExpertise.modules,
    skills: form.sapExpertise.technicalSkills,
    module_experience: form.sapExpertise.moduleExperience,
    preferred_job_roles: form.preferences.preferredJobRoles,
    preferred_sap_modules: form.preferences.preferredSapModules,
    preferred_locations: preferredLocations,
    preferred_salary_range: form.preferences.preferredSalaryRange.trim() || null,
    career_level: form.preferences.careerLevel || null,
    work_modes: form.preferences.workModes.map(
      (mode) => WORK_MODE_TO_DB[mode],
    ),
    employment_types: form.preferences.employmentTypes.map(
      (type) => EMPLOYMENT_TYPE_TO_DB[type],
    ),
    is_searchable: form.openToWork.enabled,
    discovery_status: form.openToWork.enabled
      ? ("open_to_opportunities" as const)
      : ("not_available" as const),
    open_to_work_job_roles: form.openToWork.preferredJobRoles,
    open_to_work_locations: form.openToWork.preferredLocations,
    open_to_work_modes: form.openToWork.preferredWorkModes.map(
      (mode) => WORK_MODE_TO_DB[mode],
    ),
    availability: form.openToWork.availability.trim() || null,
    avatar_url: form.photoUrl,
    profile_photo_url: form.photoUrl,
    profile_completion: profileCompletion,
    certifications: form.certifications.map((cert) => ({
      id: cert.id,
      name: cert.name,
      issuingOrganization: cert.issuingOrganization,
      certificationId: cert.certificationId,
      issueDate: cert.issueDate,
      expiryDate: cert.expiryDate,
      status: cert.status,
    })),
  };
}
