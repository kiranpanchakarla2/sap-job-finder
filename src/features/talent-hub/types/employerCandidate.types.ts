import type {
  PublicAvailability,
  PublicExperienceBand,
  PublicRoleCategory,
  PublicWorkMode,
} from "./publicTalent.types";

export type EmployerCandidateExperience = {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string | null;
  description: string;
  skills: string[];
  isSapProject?: boolean;
};

export type EmployerCandidateEducation = {
  id: string;
  school: string;
  degree: string;
  field: string;
  year: number;
};

export type EmployerCandidateCertification = {
  id: string;
  name: string;
  issuingOrg: string;
  year: number;
  credentialId?: string;
};

export type EmployerCandidateProfile = {
  id: string;
  name: string;
  headline: string;
  title: string;
  avatarUrl: string | null;
  roleCategory: PublicRoleCategory;
  yearsOfExperience: number;
  experienceBand: PublicExperienceBand;
  location: string;
  city: string;
  country: string;
  preferredLocations: string[];
  workModes: PublicWorkMode[];
  employmentTypes: ("full_time" | "part_time" | "contract" | "contract_to_hire")[];
  availability: PublicAvailability;
  noticePeriod?: string;
  sapModules: string[];
  skills: string[];
  certifications: EmployerCandidateCertification[];
  experience: EmployerCandidateExperience[];
  education: EmployerCandidateEducation[];
  languages: string[];
  professionalSummary: string;
  resumeUrl?: string | null;
  resumeFileName?: string | null;
  hasResumeAccess: boolean;
  discoveryStatus: "open_to_opportunities" | "available" | "not_available";
  isSearchable: boolean;
};

export type EmployerCandidateServiceResult =
  | {
      success: true;
      data: EmployerCandidateProfile;
    }
  | {
      success: false;
      code:
        | "UNAUTHENTICATED"
        | "UNAUTHORIZED"
        | "CANDIDATE_NOT_AVAILABLE"
        | "PRIVATE_PROFILE"
        | "GENERIC";
      error: string;
    };
